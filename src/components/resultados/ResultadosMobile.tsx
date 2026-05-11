import Image from 'next/image'
import { ROL_INFO, Rol360 as Rol } from '@/types'
import { Arquetipo, ArquetipoCtx } from '@/lib/arquetipos'
import VistaPerspectivasMobile from './VistaPerspectivasMobile'
import ArquetiposEquipoMobile from './ArquetiposEquipoMobile'

const ROL_ORDEN: Rol[] = ['A', 'C', 'D', 'B']

const ROL_NEON: Record<Rol, string> = {
  A: '#00E6FF',
  B: '#FF6600',
  C: '#FF3366',
  D: '#37FF25',
}

type DimResult = {
  id: number
  nombre: string
  subtitulo: string
  promedios: Partial<Record<Rol, number>>
  delta: number
  promedioGeneral: number | null
}

type Props = {
  nombreCompania: string
  estado: string
  totalParticipantes: number
  personasEquipo: number
  personasLider: number
  totalFormularios: number
  resultados: DimResult[]
  promediosPorRol: Record<Rol, Record<number, number | null>>
  promedioGlobalPorRol: Record<Rol, number | null>
  arqBrechas: Arquetipo
  arqRelaciones: Arquetipo
  arqCtx: ArquetipoCtx
  diagnosticoId: string
}

const deltaBg = (d: number) => d >= 5 ? '#F2C2C2' : d >= 3 ? '#FCE99A' : '#C8E6C9'

function SectionBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{
      background: 'var(--ink)', padding: '10px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-.01em', margin: 0, color: '#fff' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, color: '#fff', textAlign: 'right' }}>{subtitle}</span>}
    </div>
  )
}

export default function ResultadosMobile({
  nombreCompania, estado, totalParticipantes, personasEquipo, personasLider, totalFormularios,
  resultados, promediosPorRol, promedioGlobalPorRol, arqBrechas, arqRelaciones, arqCtx, diagnosticoId,
}: Props) {
  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header slim */}
      <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={120} height={31} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--mute)', fontSize: 12, marginTop: 4 }}>/</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 4 }}>Resultados</span>
        </div>
      </header>

      {/* Título */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1.5px solid var(--ink)' }}>
        <span className="page-header__eyebrow">Diagnóstico organizacional</span>
        <div className="page-header__rule" />
        <h1 style={{ fontSize: 'clamp(28px, 8vw, 36px)', fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: 0 }}>
          {nombreCompania}
        </h1>
      </div>

      {/* Resumen */}
      <SectionBar title="Resumen de respuestas" subtitle={`Estado · ${estado}`} />
      <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Participantes',    count: totalParticipantes },
            { label: 'Personas equipo',  count: personasEquipo },
            { label: 'Líder',            count: personasLider },
            { label: '# formularios',    count: totalFormularios },
          ].map((g, i) => (
            <div key={g.label} style={{
              padding: '14px 16px',
              borderRight: i % 2 === 0 ? '1.5px solid var(--ink)' : 'none',
              borderBottom: i < 2 ? '1.5px solid var(--ink)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
                {g.label}
              </span>
              <div style={{ fontWeight: 900, fontSize: 32, lineHeight: 1, letterSpacing: '-.03em' }}>
                {g.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promedios por dimensión */}
      <SectionBar title="Promedios por dimensión" subtitle="Escala 1–10" />
      <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
        {[...resultados].sort((a, b) => (b.promedioGeneral ?? -Infinity) - (a.promedioGeneral ?? -Infinity)).map((dim, i, arr) => (
          <div key={dim.id} style={{
            padding: '20px 20px 22px',
            borderBottom: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
              <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
            </div>
            <div style={{ width: 36, height: 6, background: 'var(--ink)' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 56, lineHeight: 1, letterSpacing: '-.04em' }}>
                {dim.promedioGeneral !== null ? dim.promedioGeneral.toFixed(1) : '—'}
              </span>
              {dim.promedioGeneral !== null && (
                <span style={{ fontWeight: 700, fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>
                  <span style={{ position: 'relative', top: -4 }}>/</span>
                  <span>10</span>
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1.5px solid var(--ink)', marginTop: 6 }}>
              {[...ROL_ORDEN].sort((a, b) => (dim.promedios[b] ?? -Infinity) - (dim.promedios[a] ?? -Infinity)).map((rol, idx, rolArr) => {
                const val = dim.promedios[rol]
                return (
                  <div key={rol} style={{
                    display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 10, alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx < rolArr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROL_NEON[rol] }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{ROL_INFO[rol].label}</span>
                    <b style={{ fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: val !== undefined ? 'var(--ink)' : 'var(--mute)' }}>
                      {val !== undefined ? val.toFixed(1) : '—'}
                    </b>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Brechas */}
      <SectionBar title="¿Qué tan lejos están las visiones?" subtitle="Brechas por dimensión" />
      <div style={{ padding: '24px 20px 32px', borderBottom: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0, fontWeight: 500 }}>
          Cada fila es una dimensión, cada punto una perspectiva. La distancia entre puntos es la brecha.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ROL_ORDEN.map(rol => (
            <span key={rol} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROL_NEON[rol] }} />
              {ROL_INFO[rol].label}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[...resultados].sort((a, b) => a.delta - b.delta).map(dim => (
            <div key={dim.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em' }}>{dim.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 500, marginTop: 2 }}>{dim.subtitulo}</div>
                </div>
                <span style={{
                  display: 'inline-block', padding: '5px 10px',
                  background: deltaBg(dim.delta),
                  fontSize: 12, fontWeight: 900, letterSpacing: '-.01em',
                  fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                }}>
                  Δ {dim.delta.toFixed(1)}
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', height: 22 }}>
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
                        width: 14, height: 14, borderRadius: '50%',
                        background: ROL_NEON[rol],
                        border: '2px solid var(--card)',
                        boxShadow: '0 0 0 1.5px var(--ink)',
                      }} />
                    )
                  })}
                </div>
                <div style={{ position: 'relative', height: 12, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <span key={n} style={{
                      position: 'absolute', top: 0,
                      left: `${((n - 1) / 9) * 100}%`,
                      transform: 'translateX(-50%)',
                      fontSize: 9, color: 'var(--mute)', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    }}>{n}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Perspectivas comparadas */}
      <SectionBar title="Perspectivas comparadas" subtitle="Radar o mapa de calor" />
      <VistaPerspectivasMobile
        promediosPorRol={promediosPorRol}
        promedioGlobalPorRol={promedioGlobalPorRol}
      />

      {/* Arquetipos */}
      <SectionBar title="Arquetipos del equipo" subtitle="Patrones detectados" />
      <ArquetiposEquipoMobile brechas={arqBrechas} relaciones={arqRelaciones} ctx={arqCtx} diagnosticoId={diagnosticoId} />

      {/* Footer */}
      <div style={{
        padding: '20px', display: 'flex', flexDirection: 'column', gap: 6,
        fontSize: 9.5, color: 'var(--ink)', letterSpacing: '.08em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>
        <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
        <span>Diag · V1.0</span>
      </div>
    </div>
  )
}
