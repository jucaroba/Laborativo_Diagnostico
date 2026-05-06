import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'
import Image from 'next/image'
import VistaPerspectivas from '@/components/resultados/VistaPerspectivas'
import ArquetiposEquipo from '@/components/resultados/ArquetiposEquipo'
import ResultadosMobile from '@/components/resultados/ResultadosMobile'
import { evaluarBrechas, evaluarRelaciones } from '@/lib/arquetipos'

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

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('codigo_resultados', codigo)
    .single()

  if (!diag) notFound()

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, dimension_id, rol')
    .eq('diagnostico_id', diag.id)

  const { data: participantes } = await supabase
    .from('participantes')
    .select('id, rol')
    .eq('diagnostico_id', diag.id)

  const participanteIds = (participantes ?? []).map(p => p.id)
  const { data: respuestas } = await supabase
    .from('respuestas')
    .select('participante_id, pregunta_id, valor')
    .in('participante_id', participanteIds.length > 0 ? participanteIds : ['00000000-0000-0000-0000-000000000000'])

  const totalParticipantes = participantes?.length ?? 0

  const conteoPorRol: Record<Rol, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of participantes ?? []) conteoPorRol[p.rol as Rol]++

  // En el flujo real cada participante elige perfil "equipo" (rol A) o "líder" (rol D) en intake
  // y responde dos perspectivas (A+C o D+B). Por eso solo contamos personas reales por A y D.
  const personasEquipo = conteoPorRol.A
  const personasLider = conteoPorRol.D

  // Cada persona llena 2 formularios (2 perspectivas). Contamos combos únicos (participante, perspectiva).
  const formulariosSet = new Set<string>()
  for (const resp of respuestas ?? []) {
    const pregunta = preguntas?.find(p => p.id === resp.pregunta_id)
    if (!pregunta) continue
    formulariosSet.add(`${resp.participante_id}|${pregunta.rol}`)
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
  const arqBrechas = evaluarBrechas(arqCtx)
  const arqRelaciones = evaluarRelaciones(arqCtx)

  return (
    <>
    <div className="only-mobile">
      <ResultadosMobile
        nombreCompania={diag.nombre_compania}
        estado={diag.estado}
        totalParticipantes={totalParticipantes}
        personasEquipo={personasEquipo}
        personasLider={personasLider}
        totalFormularios={totalFormularios}
        resultados={resultados}
        promediosPorRol={promediosPorRol}
        promedioGlobalPorRol={promedioGlobalPorRol}
        arqBrechas={arqBrechas}
        arqRelaciones={arqRelaciones}
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
      <div style={{ padding: '40px 56px 32px', borderBottom: '1.5px solid var(--ink)' }}>
        <span className="page-header__eyebrow">Diagnóstico organizacional</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>
          {diag.nombre_compania}
        </h1>
      </div>

      {/* ============================================ */}
      {/* SECCIÓN 1 · RESUMEN DE RESPUESTAS            */}
      {/* ============================================ */}
      <SectionBar title="Resumen de respuestas" subtitle={`Estado · ${diag.estado}`} />

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1.5px solid var(--ink)' }}>
        {[...resultados].sort((a, b) => (b.promedioGeneral ?? -Infinity) - (a.promedioGeneral ?? -Infinity)).map((dim, i) => (
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
                      <b style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: val !== undefined ? 'var(--ink)' : 'var(--mute)' }}>
                        {val !== undefined ? val.toFixed(1) : '—'}
                      </b>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
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
                  fontVariantNumeric: 'tabular-nums',
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
                      fontSize: 10, color: 'var(--mute)', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
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

      <ArquetiposEquipo brechas={arqBrechas} relaciones={arqRelaciones} />

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
