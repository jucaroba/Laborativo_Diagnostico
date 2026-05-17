import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { DIMENSIONES, ROL_INFO, Rol360 as Rol } from '@/types'
import Image from 'next/image'
import VistaPerspectivas from '@/components/resultados/VistaPerspectivas'
import ArquetiposEquipo from '@/components/resultados/ArquetiposEquipo'
import ResultadosMobile from '@/components/resultados/ResultadosMobile'
import ResultadosPulso from '@/components/resultados/ResultadosPulso'
import ResultadosTermometro from '@/components/resultados/ResultadosTermometro'
import ResultadosEspejo from '@/components/resultados/ResultadosEspejo'
import { calcSimpleFromData, calcEspejoFromData, fetchYCalcSimple, fetchYCalcEspejo, fetchBenchmarkSimple, fetchBenchmarkEspejo } from '@/lib/calc-resultados'
import { evaluarBrechas, evaluarRelaciones } from '@/lib/arquetipos'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

export const revalidate = 0

const ROL_ORDEN: Rol[] = ['A', 'C', 'D', 'B']

// Paleta neon para el dashboard (override de ROL_INFO.color)
const ROL_NEON: Record<Rol, string> = {
  A: '#00E6FF', // Cyan       — Equipo
  B: '#FF6600', // Naranja    — Líder → Eq.
  C: '#FF3366', // Rojo       — Eq. → Líder
  D: '#37FF25', // Verde lima — Líder auto
}

export default async function ResultadosPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  // Resolución por equipo: el dashboard es de UN equipo dentro de una compañía.
  const { data: equipo } = await supabase
    .from('equipos')
    .select('*')
    .eq('codigo_resultados', codigo)
    .single()

  if (!equipo) notFound()

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('id', equipo.diagnostico_id)
    .single()

  if (!diag) notFound()

  // Las preguntas son a nivel compañía (compartidas entre sus equipos).
  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, dimension_id, rol, texto')
    .eq('diagnostico_id', diag.id)

  // Los participantes son del equipo específico.
  const { data: participantes } = await supabase
    .from('participantes')
    .select('id, rol')
    .eq('equipo_id', equipo.id)

  const participanteIds = (participantes ?? []).map(p => p.id)
  const { data: respuestas } = await supabase
    .from('respuestas')
    .select('participante_id, pregunta_id, valor')
    .in('participante_id', participanteIds.length > 0 ? participanteIds : ['00000000-0000-0000-0000-000000000000'])

  const totalParticipantes = participantes?.length ?? 0

  // ─── Branch por tipo de diagnóstico ───────────────────────────
  // Para tipos que no son Cultura 360° tenemos cálculos y vistas
  // dedicadas. La rama 360 (default) sigue debajo intacta.
  const tipoDiag = (diag.tipo ?? 'cultura_360') as string

  // Ronda anterior, si existe — para mostrar Δ en los dashboards
  const padreId = (diag as { diagnostico_padre_id?: string }).diagnostico_padre_id ?? null
  const rondaActual = (diag as { ronda?: number }).ronda ?? 1
  const rondaAnterior = rondaActual - 1

  // Benchmark Laborativo — si está habilitado, traemos el promedio histórico
  const benchmarkHabilitado = !!(diag as { benchmark_habilitado?: boolean }).benchmark_habilitado

  // Pulso y Termómetro comparten el cálculo (1 perspectiva 'X', 4 dimensiones)
  // pero usan dashboards distintos.
  if (tipoDiag === 'pulso_colectivo' || tipoDiag === 'termometro_4') {
    const resultadosSimple = calcSimpleFromData(
      (preguntas ?? []) as { id: string; dimension_id: number; rol: string }[],
      (respuestas ?? []).map(r => ({ pregunta_id: r.pregunta_id, valor: r.valor })),
    )
    const comparacion = padreId ? await fetchYCalcSimple(padreId) : null
    const benchmark = benchmarkHabilitado
      ? await fetchBenchmarkSimple(tipoDiag as 'pulso_colectivo' | 'termometro_4', diag.id)
      : null
    const totalFormulariosSimple = new Set((respuestas ?? []).map(r => r.participante_id)).size

    // Dispersión: para cada dimensión, lista de promedios por persona.
    // Una persona da varias respuestas dentro de una dimensión (1 a 3 según
    // tipo); su "promedio en la dimensión" es la media de esas respuestas.
    // El histograma agrupa esos promedios redondeados al entero 1–10.
    const preguntaToDim = new Map<string, number>()
    for (const p of preguntas ?? []) preguntaToDim.set(p.id, p.dimension_id)
    const acumPorParticipante: Record<string, Record<number, { suma: number; n: number }>> = {}
    for (const r of respuestas ?? []) {
      const dim = preguntaToDim.get(r.pregunta_id)
      if (!dim) continue
      if (!acumPorParticipante[r.participante_id]) acumPorParticipante[r.participante_id] = {}
      if (!acumPorParticipante[r.participante_id][dim]) acumPorParticipante[r.participante_id][dim] = { suma: 0, n: 0 }
      acumPorParticipante[r.participante_id][dim].suma += r.valor
      acumPorParticipante[r.participante_id][dim].n += 1
    }
    const dispersionPorDim: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
    for (const partId of Object.keys(acumPorParticipante)) {
      for (const dimStr of Object.keys(acumPorParticipante[partId])) {
        const dim = Number(dimStr)
        const cell = acumPorParticipante[partId][dim]
        if (cell.n > 0) dispersionPorDim[dim].push(cell.suma / cell.n)
      }
    }

    // Ranking de preguntas: para cada pregunta, su promedio de respuestas.
    // Sirve para mostrar "lo más alto" y "lo más bajo" del cuestionario,
    // con el texto exacto de la pregunta — la lectura más accionable del
    // dashboard.
    const respPorPregunta: Record<string, { suma: number; n: number }> = {}
    for (const r of respuestas ?? []) {
      if (!respPorPregunta[r.pregunta_id]) respPorPregunta[r.pregunta_id] = { suma: 0, n: 0 }
      respPorPregunta[r.pregunta_id].suma += r.valor
      respPorPregunta[r.pregunta_id].n += 1
    }
    type PreguntaRanking = { id: string; texto: string; dimension_id: number; promedio: number; n: number }
    const preguntasRanking: PreguntaRanking[] = (preguntas ?? [])
      .map(p => {
        const cell = respPorPregunta[p.id]
        if (!cell || cell.n === 0) return null
        return {
          id: p.id,
          texto: (p as { texto: string }).texto,
          dimension_id: p.dimension_id,
          promedio: Math.round((cell.suma / cell.n) * 10) / 10,
          n: cell.n,
        } as PreguntaRanking
      })
      .filter((p): p is PreguntaRanking => p !== null)
      .sort((a, b) => b.promedio - a.promedio)

    const sharedProps = {
      nombreCompania: diag.nombre_compania,
      estado: equipo.estado,
      totalParticipantes,
      totalFormularios: totalFormulariosSimple,
      resultados: resultadosSimple,
      comparacion,
      rondaActual,
      rondaAnterior,
      benchmark: benchmark?.resultados ?? null,
      benchmarkN: benchmark?.nDiagnosticos ?? 0,
      dispersionPorDim,
      preguntasRanking,
    }
    return tipoDiag === 'pulso_colectivo'
      ? <ResultadosPulso {...sharedProps} />
      : <ResultadosTermometro {...sharedProps} />
  }

  // ─── Equipo en Espejo: 2 perspectivas (YO, EQUIPO) por dimensión
  if (tipoDiag === 'equipo_en_espejo') {
    const resultadosEspejo = calcEspejoFromData(
      (preguntas ?? []) as { id: string; dimension_id: number; rol: string }[],
      (respuestas ?? []).map(r => ({ pregunta_id: r.pregunta_id, valor: r.valor })),
    )
    const comparacion = padreId ? await fetchYCalcEspejo(padreId) : null
    const benchmark = benchmarkHabilitado
      ? await fetchBenchmarkEspejo('equipo_en_espejo', diag.id)
      : null
    const totalFormulariosEspejo = new Set((respuestas ?? []).map(r => r.participante_id)).size

    // Dispersión por dimensión × perspectiva: promedios por persona en
    // cada combinación (dim, YO/EQUIPO). Para el histograma del Espejo.
    const preguntaToDimPersp = new Map<string, { dim: number; persp: 'YO' | 'EQUIPO' }>()
    for (const p of preguntas ?? []) {
      const persp = p.rol === 'YO' ? 'YO' : p.rol === 'EQUIPO' ? 'EQUIPO' : null
      if (!persp) continue
      preguntaToDimPersp.set(p.id, { dim: p.dimension_id, persp })
    }
    type Cell = { suma: number; n: number }
    const acumPart: Record<string, Record<number, { YO: Cell; EQUIPO: Cell }>> = {}
    for (const r of respuestas ?? []) {
      const meta = preguntaToDimPersp.get(r.pregunta_id)
      if (!meta) continue
      if (!acumPart[r.participante_id]) acumPart[r.participante_id] = {}
      if (!acumPart[r.participante_id][meta.dim]) acumPart[r.participante_id][meta.dim] = { YO: { suma: 0, n: 0 }, EQUIPO: { suma: 0, n: 0 } }
      acumPart[r.participante_id][meta.dim][meta.persp].suma += r.valor
      acumPart[r.participante_id][meta.dim][meta.persp].n += 1
    }
    const dispersionPorDimEspejo: Record<number, { YO: number[]; EQUIPO: number[] }> = {
      1: { YO: [], EQUIPO: [] }, 2: { YO: [], EQUIPO: [] },
      3: { YO: [], EQUIPO: [] }, 4: { YO: [], EQUIPO: [] },
    }
    for (const partId of Object.keys(acumPart)) {
      for (const dimStr of Object.keys(acumPart[partId])) {
        const dim = Number(dimStr)
        const cell = acumPart[partId][dim]
        if (cell.YO.n > 0)     dispersionPorDimEspejo[dim].YO.push(cell.YO.suma / cell.YO.n)
        if (cell.EQUIPO.n > 0) dispersionPorDimEspejo[dim].EQUIPO.push(cell.EQUIPO.suma / cell.EQUIPO.n)
      }
    }

    // Ranking de "preguntas con mayor brecha Yo–Equipo". Las preguntas
    // del Espejo vienen en pares conceptuales (mismo texto, una con rol
    // YO y otra con EQUIPO), pero no hay un FK que los una explícito.
    // Heurística: las parejamos por (dimension_id, orden) — el orden de
    // cada pregunta dentro de su rol coincide.
    const respPorPreg: Record<string, { suma: number; n: number }> = {}
    for (const r of respuestas ?? []) {
      if (!respPorPreg[r.pregunta_id]) respPorPreg[r.pregunta_id] = { suma: 0, n: 0 }
      respPorPreg[r.pregunta_id].suma += r.valor
      respPorPreg[r.pregunta_id].n += 1
    }
    type PregEspejo = { idYo: string; idEquipo: string; texto: string; dimension_id: number; promYo: number; promEquipo: number; brecha: number }
    const pregsYo = (preguntas ?? []).filter(p => p.rol === 'YO').sort((a, b) => {
      const ord = (x: typeof a) => (x as { orden?: number }).orden ?? 0
      return a.dimension_id - b.dimension_id || ord(a) - ord(b)
    })
    const pregsEquipo = (preguntas ?? []).filter(p => p.rol === 'EQUIPO').sort((a, b) => {
      const ord = (x: typeof a) => (x as { orden?: number }).orden ?? 0
      return a.dimension_id - b.dimension_id || ord(a) - ord(b)
    })
    const preguntasBrechaEspejo: PregEspejo[] = []
    for (let i = 0; i < Math.min(pregsYo.length, pregsEquipo.length); i++) {
      const py = pregsYo[i]
      const pe = pregsEquipo[i]
      if (py.dimension_id !== pe.dimension_id) continue
      const cy = respPorPreg[py.id]
      const ce = respPorPreg[pe.id]
      if (!cy || !ce || cy.n === 0 || ce.n === 0) continue
      const promYo = Math.round((cy.suma / cy.n) * 10) / 10
      const promEquipo = Math.round((ce.suma / ce.n) * 10) / 10
      preguntasBrechaEspejo.push({
        idYo: py.id, idEquipo: pe.id,
        texto: (py as { texto: string }).texto,
        dimension_id: py.dimension_id,
        promYo, promEquipo,
        brecha: Math.round(Math.abs(promYo - promEquipo) * 10) / 10,
      })
    }
    preguntasBrechaEspejo.sort((a, b) => b.brecha - a.brecha)

    return (
      <ResultadosEspejo
        nombreCompania={diag.nombre_compania}
        estado={equipo.estado}
        totalParticipantes={totalParticipantes}
        totalFormularios={totalFormulariosEspejo}
        resultados={resultadosEspejo}
        comparacion={comparacion}
        rondaActual={rondaActual}
        rondaAnterior={rondaAnterior}
        benchmark={benchmark?.resultados ?? null}
        benchmarkN={benchmark?.nDiagnosticos ?? 0}
        dispersionPorDimEspejo={dispersionPorDimEspejo}
        preguntasBrechaEspejo={preguntasBrechaEspejo}
      />
    )
  }

  // ─── Cultura 360° (legacy / default) ──────────────────────────

  const conteoPorRol: Record<Rol, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of participantes ?? []) conteoPorRol[p.rol as Rol]++

  // En el flujo real cada participante elige perfil "equipo" (rol A) o "líder" (rol D) en intake
  // y responde dos perspectivas (A+C o D+B). Por eso solo contamos personas reales por A y D.
  const personasEquipo = conteoPorRol.A
  const personasLider = conteoPorRol.D

  // Un formulario = una persona que respondió. Cada participante cubre dos
  // perspectivas (equipo: A+C, líder: D+B), pero conceptualmente es un solo
  // diligenciamiento por persona.
  const formulariosSet = new Set<string>()
  for (const resp of respuestas ?? []) {
    formulariosSet.add(resp.participante_id)
  }
  const totalFormularios = formulariosSet.size

  type Acum = Record<number, Record<Rol, { suma: number; n: number }>>
  const acum: Acum = {}
  for (const dim of DIMENSIONES) {
    acum[dim.id] = { A: { suma: 0, n: 0 }, B: { suma: 0, n: 0 }, C: { suma: 0, n: 0 }, D: { suma: 0, n: 0 } }
  }

  for (const resp of respuestas ?? []) {
    const pregunta = preguntas?.find(p => p.id === resp.pregunta_id)
    if (!pregunta) continue
    acum[pregunta.dimension_id][pregunta.rol as Rol].suma += resp.valor
    acum[pregunta.dimension_id][pregunta.rol as Rol].n += 1
  }

  const resultados = DIMENSIONES.map(dim => {
    const promedios: Partial<Record<Rol, number>> = {}
    for (const r of ROL_ORDEN) {
      const d = acum[dim.id][r]
      if (d.n > 0) promedios[r] = Math.round((d.suma / d.n) * 10) / 10
    }
    const vals = Object.values(promedios).filter((v): v is number => typeof v === 'number')
    const delta = vals.length > 1 ? Math.round((Math.max(...vals) - Math.min(...vals)) * 10) / 10 : 0
    const promedioGeneral = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
    const rolesConRespuesta = ROL_ORDEN.filter(r => acum[dim.id][r].n > 0)
    return { ...dim, promedios, delta, promedioGeneral, rolesConRespuesta }
  })

  const deltaBg = (d: number) => d >= 5 ? '#F2C2C2' : d >= 3 ? '#FCE99A' : '#C8E6C9'

  // Promedios por rol para el radar (rol → dimId → valor) y promedio global por rol
  const promediosPorRol: Record<Rol, Record<number, number | null>> = { A: {}, B: {}, C: {}, D: {} }
  const promedioGlobalPorRol: Record<Rol, number | null> = { A: null, B: null, C: null, D: null }
  for (const rol of ROL_ORDEN) {
    const valoresDim: number[] = []
    for (const dim of DIMENSIONES) {
      const d = acum[dim.id][rol]
      if (d.n > 0) {
        const v = Math.round((d.suma / d.n) * 10) / 10
        promediosPorRol[rol][dim.id] = v
        valoresDim.push(v)
      } else {
        promediosPorRol[rol][dim.id] = null
      }
    }
    if (valoresDim.length > 0) {
      promedioGlobalPorRol[rol] = Math.round((valoresDim.reduce((a, b) => a + b, 0) / valoresDim.length) * 10) / 10
    }
  }

  // Promedio por dimensión y delta por dimensión para detectar arquetipos
  const promedioDim: Record<number, number | null> = {}
  const deltaDim: Record<number, number> = {}
  for (const r of resultados) {
    promedioDim[r.id] = r.promedioGeneral
    deltaDim[r.id] = r.delta
  }
  const arqCtx = { promedioDim, deltaDim, promediosPorRol, promedioGlobalPorRol }
  let arqBrechas = evaluarBrechas(arqCtx)
  let arqRelaciones = evaluarRelaciones(arqCtx)

  // Overrides persistidos: si el equipo regeneró la lectura desde el dashboard,
  // se usa esa en vez de la auto-generada. Mantenemos tag y patrón (data) y
  // sustituimos solo el copy.
  type Override = { titulo?: string; resumen?: string; cuerpo?: string; cita?: string; accion?: string }
  const ovBrechas    = (diag as { arquetipo_brechas_override?: Override }).arquetipo_brechas_override
  const ovRelaciones = (diag as { arquetipo_relaciones_override?: Override }).arquetipo_relaciones_override
  if (ovBrechas)    arqBrechas    = { ...arqBrechas,    ...ovBrechas }
  if (ovRelaciones) arqRelaciones = { ...arqRelaciones, ...ovRelaciones }

  return (
    <>
    <div className="only-mobile">
      <ResultadosMobile
        nombreCompania={diag.nombre_compania}
        estado={equipo.estado}
        totalParticipantes={totalParticipantes}
        personasEquipo={personasEquipo}
        personasLider={personasLider}
        totalFormularios={totalFormularios}
        resultados={resultados}
        promediosPorRol={promediosPorRol}
        promedioGlobalPorRol={promedioGlobalPorRol}
        arqBrechas={arqBrechas}
        arqRelaciones={arqRelaciones}
        arqCtx={arqCtx}
        diagnosticoId={diag.id}
        rondaActual={rondaActual}
      />
    </div>
    <div className="only-desktop" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header — patrón slim laborativo / Resultados */}
      <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Resultados</span>
        </div>
      </header>

      {/* Container central angosto */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Título del diagnóstico */}
      <div style={{ padding: '40px 24px 32px', borderBottom: '1.5px solid var(--ink)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
            background: 'var(--ink)', color: '#fff', padding: '3px 8px',
          }}>{TIPOS_DIAGNOSTICO[(diag.tipo ?? 'cultura_360') as keyof typeof TIPOS_DIAGNOSTICO]?.etiqueta ?? diag.tipo}</span>
          {rondaActual > 1 && (
            <span style={{
              fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
              background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--ink)', padding: '2px 8px',
            }}>Ronda {rondaActual}</span>
          )}
        </div>
        <h1 className="page-header__title" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>
          {diag.nombre_compania}
        </h1>
      </div>

      {/* ============================================ */}
      {/* SECCIÓN 1 · RESUMEN DE RESPUESTAS            */}
      {/* ============================================ */}
      <SectionBar title="Resumen de respuestas" subtitle={`Estado · ${equipo.estado}`} />

      <div style={{ padding: '32px 56px', borderBottom: '1.5px solid var(--ink)' }}>

        {/* Stats top row — 4 indicadores en línea, mismo formato */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginLeft: -56, marginRight: -56 }}>
          {[
            { label: 'Participantes',    count: totalParticipantes, color: null },
            { label: 'Personas equipo',  count: personasEquipo,     color: ROL_NEON.A },
            { label: 'Líder',            count: personasLider,      color: ROL_NEON.D },
            { label: '# de formularios', count: totalFormularios,   color: null },
          ].map((g, i, arr) => (
            <div key={g.label} style={{
              padding: '16px 18px',
              borderRight: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
                {g.label}
              </span>
              <div style={{ fontWeight: 900, fontSize: 40, lineHeight: 1, letterSpacing: '-.03em' }}>
                {g.count}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ============================================ */}
      {/* SECCIÓN 2 · PROMEDIOS POR DIMENSIÓN          */}
      {/* ============================================ */}
      <SectionBar title="Promedios por dimensión" subtitle="Escala 1–10" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1.5px solid var(--ink)' }}>
        {[...resultados].sort((a, b) => (b.promedioGeneral ?? -Infinity) - (a.promedioGeneral ?? -Infinity)).map((dim) => (
          <div key={dim.id} style={{
            display: 'flex', flexDirection: 'column',
            paddingTop: 28,
          }}>
            <div style={{
              padding: '0 24px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
              </div>

              <div style={{ width: 42, height: 8, background: 'var(--ink)' }} />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, color: 'var(--ink)' }}>
                <span style={{ fontWeight: 900, fontSize: 72, lineHeight: 1, letterSpacing: '-.04em' }}>
                  {dim.promedioGeneral !== null ? dim.promedioGeneral.toFixed(1) : '—'}
                </span>
                {dim.promedioGeneral !== null && (
                  <span style={{ fontWeight: 700, fontSize: 36, lineHeight: 1, letterSpacing: '-.02em', color: 'var(--ink)' }}>
                    <span style={{ position: 'relative', top: -5 }}>/</span>
                    <span style={{ position: 'relative', top: 0 }}>10</span>
                  </span>
                )}
              </div>
            </div>
            {/* Desglose por rol */}
            <div style={{ padding: '14px 24px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1.5px solid var(--ink)', marginTop: 8 }}>
                {[...ROL_ORDEN].sort((a, b) => (dim.promedios[b] ?? -Infinity) - (dim.promedios[a] ?? -Infinity)).map((rol, idx, arr) => {
                  const val = dim.promedios[rol]
                  return (
                    <div key={rol} style={{
                      display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 10, alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: idx < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                    }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROL_NEON[rol] }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{ROL_INFO[rol].label}</span>
                      <b style={{ fontSize: 14, fontWeight: 900, fontFeatureSettings: '"tnum" 1, "zero" 0', color: val !== undefined ? 'var(--ink)' : 'var(--mute)' }}>
                        {val !== undefined ? val.toFixed(1) : '—'}
                      </b>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Card "Promedio" — quinta columna, promedio global */}
        {(() => {
          // Promedio general (de los promedios generales de cada dimensión)
          const valsDim = resultados.map(r => r.promedioGeneral).filter((v): v is number => typeof v === 'number')
          const promGlobal = valsDim.length ? Math.round((valsDim.reduce((a, b) => a + b, 0) / valsDim.length) * 10) / 10 : null
          return (
            <div style={{
              display: 'flex', flexDirection: 'column',
              paddingTop: 28,
              position: 'relative',
            }}>
              {/* Separador vertical: de la altura del eyebrow GLOBAL hasta
                  la última fila del desglose (Equipo → Líder). */}
              <span aria-hidden style={{
                position: 'absolute', left: 0, top: 28, bottom: 24,
                width: 1.5, background: 'var(--ink)',
              }} />
              <div style={{
                padding: '0 24px',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>Global</div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>Promedio</h3>
                </div>

                <div style={{ width: 42, height: 8, background: 'var(--ink)' }} />

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, color: 'var(--ink)' }}>
                  <span style={{ fontWeight: 900, fontSize: 72, lineHeight: 1, letterSpacing: '-.04em' }}>
                    {promGlobal !== null ? promGlobal.toFixed(1) : '—'}
                  </span>
                  {promGlobal !== null && (
                    <span style={{ fontWeight: 700, fontSize: 36, lineHeight: 1, letterSpacing: '-.02em', color: 'var(--ink)' }}>
                      <span style={{ position: 'relative', top: -5 }}>/</span>
                      <span style={{ position: 'relative', top: 0 }}>10</span>
                    </span>
                  )}
                </div>
              </div>
              {/* Desglose por rol — usa el promedio global por rol */}
              <div style={{ padding: '14px 24px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1.5px solid var(--ink)', marginTop: 8 }}>
                  {[...ROL_ORDEN].sort((a, b) => (promedioGlobalPorRol[b] ?? -Infinity) - (promedioGlobalPorRol[a] ?? -Infinity)).map((rol, idx, arr) => {
                    const val = promedioGlobalPorRol[rol]
                    return (
                      <div key={rol} style={{
                        display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 10, alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                      }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROL_NEON[rol] }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{ROL_INFO[rol].label}</span>
                        <b style={{ fontSize: 14, fontWeight: 900, fontFeatureSettings: '"tnum" 1, "zero" 0', color: val !== null ? 'var(--ink)' : 'var(--mute)' }}>
                          {val !== null ? val.toFixed(1) : '—'}
                        </b>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ============================================ */}
      {/* SECCIÓN 3 · BRECHAS · LÍNEA DE PERSPECTIVAS  */}
      {/* ============================================ */}
      <SectionBar title="¿Qué tan lejos están las visiones?" subtitle="Brechas por dimensión" />

      <div style={{ padding: '40px 96px 56px 96px', borderBottom: '1.5px solid var(--ink)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '0 0 40px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: '60ch', margin: 0, fontWeight: 500 }}>
            Cada fila es una dimensión, cada punto una perspectiva.<br />La distancia entre puntos es la brecha.
          </p>
          <span style={{ width: 1.5, alignSelf: 'stretch', background: 'var(--ink)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {ROL_ORDEN.map(rol => (
              <span key={rol} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: ROL_NEON[rol] }} />
                {ROL_INFO[rol].label}
              </span>
            ))}
          </div>
        </div>

        {/* Filas por dimensión */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {[...resultados].sort((a, b) => a.delta - b.delta).map(dim => (
            <div key={dim.id} style={{ display: 'grid', gridTemplateColumns: '160px 90px 1fr', gap: 16, alignItems: 'center' }}>
              {/* Label */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.02em' }}>{dim.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500, marginTop: 2 }}>{dim.subtitulo}</div>
              </div>

              {/* Delta badge */}
              <div>
                <span style={{
                  display: 'inline-block', padding: '6px 12px',
                  background: deltaBg(dim.delta),
                  fontSize: 13, fontWeight: 900, letterSpacing: '-.01em',
                  fontFeatureSettings: '"tnum" 1, "zero" 0',
                }}>
                  Δ {dim.delta.toFixed(1)}
                </span>
              </div>

              {/* Línea con dots */}
              <div style={{ position: 'relative' }}>
                {/* Línea base */}
                <div style={{ position: 'relative', height: 24 }}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: 'var(--ink)', opacity: .25 }} />
                  {(() => {
                    const valores = ROL_ORDEN.map(r => dim.promedios[r]).filter((v): v is number => typeof v === 'number')
                    if (valores.length < 2) return null
                    const min = Math.min(...valores)
                    const max = Math.max(...valores)
                    return (
                      <div style={{
                        position: 'absolute', top: '50%',
                        left: `${((min - 1) / 9) * 100}%`,
                        width: `${((max - min) / 9) * 100}%`,
                        height: 1.5, background: 'var(--ink)',
                        transform: 'translateY(-50%)',
                      }} />
                    )
                  })()}
                  {ROL_ORDEN.map(rol => {
                    const val = dim.promedios[rol]
                    if (val === undefined) return null
                    const left = `${((val - 1) / 9) * 100}%`
                    return (
                      <div key={rol} title={`${ROL_INFO[rol].label}: ${val}`} style={{
                        position: 'absolute', top: '50%', left,
                        transform: 'translate(-50%, -50%)',
                        width: 16, height: 16, borderRadius: '50%',
                        background: ROL_NEON[rol],
                        border: '2px solid var(--card)',
                        boxShadow: '0 0 0 1.5px var(--ink)',
                      }} />
                    )
                  })}
                </div>
                {/* Eje */}
                <div style={{ position: 'relative', height: 14, marginTop: 6 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <span key={n} style={{
                      position: 'absolute', top: 0,
                      left: `${((n - 1) / 9) * 100}%`,
                      transform: 'translateX(-50%)',
                      fontSize: 10, color: 'var(--mute)', fontWeight: 600, fontFeatureSettings: '"tnum" 1, "zero" 0',
                    }}>{n}</span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* ============================================ */}
      {/* SECCIÓN 4 · RADAR · PERSPECTIVAS COMPARADAS  */}
      {/* ============================================ */}
      <SectionBar title="Perspectivas comparadas" subtitle="Radar o mapa de calor" />

      <VistaPerspectivas
        promediosPorRol={promediosPorRol}
        promedioGlobalPorRol={promedioGlobalPorRol}
      />

      {/* ============================================ */}
      {/* SECCIÓN 5 · ARQUETIPOS DEL EQUIPO            */}
      {/* ============================================ */}
      <SectionBar title="Arquetipos del equipo" subtitle="Patrones detectados en los datos" />

      <ArquetiposEquipo brechas={arqBrechas} relaciones={arqRelaciones} ctx={arqCtx} diagnosticoId={diag.id} />

      </div> {/* /Container central */}

      {/* Footer */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
        <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
        <span>Diag · V1.0</span>
      </div>

    </div>
    </>
  )
}

function SectionBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ background: 'var(--ink)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.01em', margin: 0, color: '#fff' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, color: '#fff' }}>{subtitle}</span>}
    </div>
  )
}
