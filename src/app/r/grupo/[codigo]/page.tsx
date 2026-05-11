import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Fragment } from 'react'
import { DIMENSIONES, Grupo } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

export const revalidate = 0

type EquipoStats = {
  id: string
  nombre: string
  ronda: number
  estado: string
  participantes: number
  dims: { id: number; promedio: number | null; n: number }[]
  global: number | null
}

const round1 = (n: number) => Math.round(n * 10) / 10

// Paleta diverging: rojo (bajo) → amarillo (medio) → verde (alto)
const HEAT_LOW: [number, number, number] = [215, 48, 39]
const HEAT_MID: [number, number, number] = [254, 224, 139]
const HEAT_HIGH: [number, number, number] = [26, 152, 80]

const lerp = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]
const heatRgb = (val: number): [number, number, number] => {
  const t = Math.max(0, Math.min(1, (val - 1) / 9))
  return t < 0.5 ? lerp(HEAT_LOW, HEAT_MID, t * 2) : lerp(HEAT_MID, HEAT_HIGH, (t - 0.5) * 2)
}
const cellBg = (val: number | null) => {
  if (val === null) return 'var(--bg-2)'
  const [r, g, b] = heatRgb(val)
  return `rgb(${r}, ${g}, ${b})`
}
const cellText = (val: number | null) => val === null ? 'var(--mute)' : '#0A0A0A'

export default async function ComparativoGrupoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: grupoData } = await supabase.from('grupos').select('*').eq('codigo_resultados', codigo).maybeSingle()
  if (!grupoData) notFound()
  const grupo = grupoData as Grupo
  const tipoConfig = TIPOS_DIAGNOSTICO[grupo.tipo]

  const { data: diags } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, ronda, estado, created_at')
    .eq('grupo_id', grupo.id)
    .order('created_at')

  const equipos: EquipoStats[] = await Promise.all((diags ?? []).map(async d => {
    const [{ data: preg }, { data: parts }] = await Promise.all([
      supabase.from('preguntas').select('id, dimension_id').eq('diagnostico_id', d.id),
      supabase.from('participantes').select('id').eq('diagnostico_id', d.id),
    ])
    const partIds = (parts ?? []).map(p => p.id)
    const { data: resp } = partIds.length > 0
      ? await supabase.from('respuestas').select('pregunta_id, valor').in('participante_id', partIds)
      : { data: [] as { pregunta_id: string; valor: number }[] }

    const porDim: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
    for (const r of resp ?? []) {
      const pq = preg?.find(p => p.id === r.pregunta_id)
      if (!pq || !porDim[pq.dimension_id]) continue
      porDim[pq.dimension_id].push(r.valor)
    }
    const dims = DIMENSIONES.map(dim => {
      const vals = porDim[dim.id]
      return {
        id: dim.id,
        promedio: vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
        n: vals.length,
      }
    })
    const allVals = Object.values(porDim).flat()
    const global = allVals.length ? round1(allVals.reduce((a, b) => a + b, 0) / allVals.length) : null
    return {
      id: d.id,
      nombre: d.nombre_compania,
      ronda: d.ronda ?? 1,
      estado: d.estado,
      participantes: parts?.length ?? 0,
      dims,
      global,
    }
  }))

  // Promedio del grupo por dimensión
  const promedioGrupoPorDim = DIMENSIONES.map(dim => {
    const vals = equipos.map(e => e.dims.find(d => d.id === dim.id)?.promedio).filter((v): v is number => typeof v === 'number')
    return vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  })
  const promedioGrupoGlobal = (() => {
    const vals = equipos.map(e => e.global).filter((v): v is number => typeof v === 'number')
    return vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  })()

  const totalParticipantes = equipos.reduce((s, e) => s + e.participantes, 0)

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Comparativo</span>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Título */}
        <div style={{ padding: '40px 40px 32px', borderBottom: '1.5px solid var(--ink)' }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', marginBottom: 8,
            fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
            fontWeight: 700, background: 'var(--ink)', color: '#fff',
          }}>{tipoConfig?.etiqueta ?? grupo.tipo}</span>
          <h1 className="page-header__title" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>
            {grupo.nombre}
          </h1>
          <p className="page-header__subtitle" style={{ marginTop: 8 }}>
            Comparativo entre equipos · {tipoConfig?.nombre ?? grupo.tipo}
          </p>
        </div>

        {/* Resumen */}
        <div style={{ background: 'var(--ink)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.01em', margin: 0, color: '#fff' }}>Resumen del grupo</h2>
          <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, color: '#fff' }}>Escala 1–10</span>
        </div>
        <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[
              { label: 'Equipos', count: equipos.length },
              { label: 'Participantes', count: totalParticipantes },
              { label: 'Promedio del grupo', count: promedioGrupoGlobal !== null ? promedioGrupoGlobal.toFixed(1) : '—' },
            ].map((g, i, arr) => (
              <div key={g.label} style={{
                padding: '16px 24px',
                borderRight: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              }}>
                <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{g.label}</span>
                <div style={{ fontWeight: 900, fontSize: 40, lineHeight: 1, letterSpacing: '-.03em' }}>{g.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa de calor: equipos × dimensiones */}
        <div style={{ background: 'var(--ink)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.01em', margin: 0, color: '#fff' }}>Mapa de calor por equipo</h2>
          <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, color: '#fff' }}>Promedio general por dimensión</span>
        </div>

        {equipos.length === 0 ? (
          <div style={{ padding: '32px 40px', borderBottom: '1.5px solid var(--ink)' }}>
            <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay diagnósticos en este grupo.</p>
          </div>
        ) : (
          <div style={{ padding: '24px 40px 40px', borderBottom: '1.5px solid var(--ink)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '240px repeat(5, 1fr)',
              border: '1.5px solid var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {/* Header row */}
              <div style={{
                borderRight: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)',
                padding: '14px 16px', background: 'var(--card)',
                display: 'flex', alignItems: 'center',
                fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)',
              }}>
                Equipo
              </div>
              {DIMENSIONES.map((dim, i) => (
                <div key={dim.id} style={{
                  borderRight: i === DIMENSIONES.length - 1 ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
                  borderBottom: '1.5px solid var(--ink)',
                  padding: '14px 16px', background: 'var(--card)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em', marginTop: 4 }}>{dim.nombre}</div>
                </div>
              ))}
              <div style={{
                borderBottom: '1.5px solid var(--ink)',
                padding: '14px 16px', background: 'var(--card)', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em' }}>Promedio</div>
              </div>

              {/* Body rows: por equipo */}
              {equipos.map((eq, rowIdx) => {
                const isLast = rowIdx === equipos.length - 1
                const rowBottom = isLast ? '3px solid var(--ink)' : '1.5px solid var(--ink)'
                return (
                  <Fragment key={eq.id}>
                    <div style={{
                      borderRight: '1.5px solid var(--ink)',
                      borderBottom: rowBottom,
                      padding: '18px 16px',
                      display: 'flex', flexDirection: 'column', gap: 4,
                      background: 'var(--card)',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                        {eq.nombre}{eq.ronda > 1 ? ` · R${eq.ronda}` : ''}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {eq.participantes} {eq.participantes === 1 ? 'participante' : 'participantes'}
                      </span>
                    </div>
                    {DIMENSIONES.map((dim, colIdx) => {
                      const val = eq.dims.find(d => d.id === dim.id)?.promedio ?? null
                      const isLastCol = colIdx === DIMENSIONES.length - 1
                      return (
                        <div key={dim.id} style={{
                          borderRight: isLastCol ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
                          borderBottom: rowBottom,
                          padding: '22px 16px',
                          background: cellBg(val), color: cellText(val),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24, fontWeight: 900, letterSpacing: '-.03em',
                        }}>
                          {val !== null ? val.toFixed(1) : '—'}
                        </div>
                      )
                    })}
                    <div style={{
                      borderBottom: rowBottom,
                      padding: '22px 16px',
                      background: cellBg(eq.global), color: cellText(eq.global),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, fontWeight: 900, letterSpacing: '-.03em',
                    }}>
                      {eq.global !== null ? eq.global.toFixed(1) : '—'}
                    </div>
                  </Fragment>
                )
              })}

              {/* Fila: promedio del grupo */}
              <div style={{
                borderRight: '1.5px solid var(--ink)',
                padding: '18px 16px', background: 'var(--card)',
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.01em' }}>Promedio del grupo</span>
              </div>
              {DIMENSIONES.map((dim, colIdx) => {
                const val = promedioGrupoPorDim[colIdx]
                const isLastCol = colIdx === DIMENSIONES.length - 1
                return (
                  <div key={dim.id} style={{
                    borderRight: isLastCol ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
                    padding: '22px 16px',
                    background: cellBg(val), color: cellText(val),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, letterSpacing: '-.03em',
                  }}>
                    {val !== null ? val.toFixed(1) : '—'}
                  </div>
                )
              })}
              <div style={{
                padding: '22px 16px',
                background: cellBg(promedioGrupoGlobal), color: cellText(promedioGrupoGlobal),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, letterSpacing: '-.03em',
              }}>
                {promedioGrupoGlobal !== null ? promedioGrupoGlobal.toFixed(1) : '—'}
              </div>
            </div>
          </div>
        )}

      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
        <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
        <span>Comparativo · V1.0</span>
      </div>
    </div>
  )
}
