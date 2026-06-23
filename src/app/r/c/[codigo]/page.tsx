import { supabase } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import { ArrowLeft } from 'lucide-react'
import { DIMENSIONES, Diagnostico, Equipo } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

export const revalidate = 0

type EquipoStats = {
  id: string
  nombre: string
  estado: string
  participantes: number
  dims: { id: number; promedio: number | null; n: number }[]
  global: number | null
}

const round1 = (n: number) => Math.round(n * 10) / 10

// Paleta diverging: rojo (bajo) → amarillo (medio) → verde (alto)
const HEAT_LOW: [number, number, number]  = [215, 48, 39]
const HEAT_MID: [number, number, number]  = [254, 224, 139]
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

export default async function ComparativoCompaniaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  // Resolución por compañía: el código identifica al diagnóstico (compañía).
  const { data: compania } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('codigo_resultados_comparativo', codigo)
    .maybeSingle()
  if (!compania) notFound()
  const c = compania as Diagnostico
  const tipoConfig = TIPOS_DIAGNOSTICO[c.tipo ?? 'cultura_360']

  const { data: equiposData } = await supabase
    .from('equipos')
    .select('*')
    .eq('diagnostico_id', c.id)
    .order('created_at')

  const equiposLista = (equiposData ?? []) as Equipo[]

  // Si solo hay un equipo, no hay nada que comparar. Redirige al dashboard del equipo.
  if (equiposLista.length === 1) {
    redirect(`/r/${equiposLista[0].codigo_resultados}`)
  }

  // Una sola pasada por preguntas (compartidas a nivel compañía)
  const { data: preg } = await supabase
    .from('preguntas')
    .select('id, dimension_id')
    .eq('diagnostico_id', c.id)
  const preguntasIdx = new Map<string, number>()
  for (const p of preg ?? []) preguntasIdx.set(p.id, p.dimension_id)

  const equipos: EquipoStats[] = await Promise.all(equiposLista.map(async eq => {
    const { data: parts } = await supabase
      .from('participantes')
      .select('id')
      .eq('equipo_id', eq.id)
    const partIds = (parts ?? []).map(p => p.id)
    const { data: resp } = partIds.length > 0
      ? await supabase.from('respuestas').select('pregunta_id, valor').in('participante_id', partIds)
      : { data: [] as { pregunta_id: string; valor: number }[] }

    const porDim: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
    for (const r of resp ?? []) {
      const dimId = preguntasIdx.get(r.pregunta_id)
      if (!dimId || !porDim[dimId]) continue
      porDim[dimId].push(r.valor)
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
      id: eq.id,
      nombre: eq.nombre,
      estado: eq.estado,
      participantes: parts?.length ?? 0,
      dims,
      global,
    }
  }))

  const promedioPorDim = DIMENSIONES.map(dim => {
    const vals = equipos.map(e => e.dims.find(d => d.id === dim.id)?.promedio).filter((v): v is number => typeof v === 'number')
    return vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  })
  const promedioGlobal = (() => {
    const vals = equipos.map(e => e.global).filter((v): v is number => typeof v === 'number')
    return vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  })()

  const totalParticipantes = equipos.reduce((s, e) => s + e.participantes, 0)

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Comparativo</span>
        </div>
        <Link
          href={`/admin/${c.id}`}
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            color: 'var(--ink)', textDecoration: 'none', border: '1.5px solid var(--ink)', padding: '6px 10px',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <ArrowLeft size={13} strokeWidth={2.5} /> Administrador
        </Link>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Título — badge con el nombre del tipo, sin subtítulo */}
        <div style={{ padding: '40px 24px 32px', borderBottom: '1.5px solid var(--ink)' }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', marginBottom: 8,
            fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
            fontWeight: 700, background: 'var(--ink)', color: '#fff',
          }}>{tipoConfig?.nombre ?? c.tipo}</span>
          <h1 className="page-header__title" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>
            {c.nombre_compania}
          </h1>
        </div>

        {/* Resumen */}
        <div style={{ background: 'var(--ink)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.01em', margin: 0, color: '#fff' }}>Comparativo entre equipos</h2>
        </div>
        <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[
              { label: 'Equipos', count: equipos.length },
              { label: 'Participantes', count: totalParticipantes },
              { label: 'Promedio de la compañía', count: promedioGlobal !== null ? promedioGlobal.toFixed(1) : '—' },
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
            <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay equipos creados en esta compañía.</p>
          </div>
        ) : (
          <div style={{ padding: '24px 40px 40px', borderBottom: '1.5px solid var(--ink)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '240px repeat(5, 1fr)',
              border: '1.5px solid var(--ink)',
              fontFeatureSettings: '"tnum" 1, "zero" 0',
            }}>
              {/* Header row — celda de la esquina vacía y sin marco arriba/izquierda
                  (se solapa 1.5px sobre el borde del contenedor para taparlo). */}
              <div style={{
                borderRight: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)',
                padding: '14px 16px', background: 'var(--bg)',
                margin: '-1.5px 0 0 -1.5px',
              }} />
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

              {/* Body rows */}
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
                      <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                        {eq.nombre}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--ink)', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600 }}>
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

              {/* Fila: promedio de la compañía */}
              <div style={{
                borderRight: '1.5px solid var(--ink)',
                padding: '18px 16px', background: 'var(--card)',
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.01em' }}>Promedio de la compañía</span>
              </div>
              {DIMENSIONES.map((dim, colIdx) => {
                const val = promedioPorDim[colIdx]
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
                background: cellBg(promedioGlobal), color: cellText(promedioGlobal),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, letterSpacing: '-.03em',
              }}>
                {promedioGlobal !== null ? promedioGlobal.toFixed(1) : '—'}
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
