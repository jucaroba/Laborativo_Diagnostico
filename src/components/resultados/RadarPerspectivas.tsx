'use client'

import { useState } from 'react'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'

const ROL_ORDEN: Rol[] = ['A', 'C', 'D', 'B']

const ROL_NEON: Record<Rol, string> = {
  A: '#00E6FF',
  B: '#FF6600',
  C: '#FF3366',
  D: '#37FF25',
}

type Props = {
  promediosPorRol: Record<Rol, Record<number, number | null>>
  promedioGlobalPorRol: Record<Rol, number | null>
}

export default function RadarPerspectivas({ promediosPorRol, promedioGlobalPorRol }: Props) {
  const [activos, setActivos] = useState<Set<Rol>>(new Set(ROL_ORDEN))
  const [hovered, setHovered] = useState<Rol | null>(null)

  const size = 520
  const center = size / 2
  const radius = size * 0.48
  const axes = DIMENSIONES.length
  const padX = 8
  // ViewBox vertical recortado con un poco de aire arriba/abajo
  const viewBoxY = 40
  const viewBoxH = 440

  // Rotado 45° → ejes apuntan a las esquinas (forma de cuadrado)
  const axisAngle = (i: number) => -Math.PI * 3 / 4 + (i * 2 * Math.PI) / axes
  const point = (i: number, val: number): [number, number] => {
    const r = (val / 10) * radius
    const a = axisAngle(i)
    return [center + r * Math.cos(a), center + r * Math.sin(a)]
  }

  // Labels FUERA de la gráfica, sobre cada eje (esquina), anclados hacia afuera
  const labelAnchor = (i: number): { textAnchor: 'start' | 'end'; dominantBaseline: 'auto' | 'hanging' } => {
    const a = axisAngle(i)
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    return {
      textAnchor: dx > 0 ? 'start' : 'end',
      dominantBaseline: dy > 0 ? 'hanging' : 'auto',
    }
  }
  const labelPos = (i: number): [number, number] => {
    const r = radius + 14
    const a = axisAngle(i)
    const x = center + r * Math.cos(a)
    // y fijo: top (Intención, Motivación) = 93, bottom (Interacción, Acción) = 425
    const y = i < 2 ? 93 : 425
    return [x, y]
  }

  const toggle = (rol: Rol) => {
    const next = new Set(activos)
    if (next.has(rol)) next.delete(rol)
    else next.add(rol)
    setActivos(next)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gap: 32,
      padding: '0 56px',
      alignItems: 'stretch',
    }}>
      {/* Toggle cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '80%', alignSelf: 'center' }}>
        {ROL_ORDEN.map(rol => {
          const activo = activos.has(rol)
          const promedio = promedioGlobalPorRol[rol]
          return (
            <button
              key={rol}
              type="button"
              onClick={() => toggle(rol)}
              onMouseEnter={() => setHovered(rol)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '16px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                background: 'transparent',
                border: '1.5px solid var(--ink)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                opacity: 1,
                flex: 1,
                minHeight: 0,
              }}
              aria-pressed={activo}
            >
              <span style={{
                fontSize: 16,
                fontWeight: 900,
                color: 'var(--ink)',
                lineHeight: 1.15,
                letterSpacing: '-.02em',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  borderBottom: activo ? '4px solid var(--ink)' : 'none',
                  paddingBottom: 4,
                }}>
                  {ROL_INFO[rol].label}
                </span>
              </span>
              <span style={{
                fontWeight: 900,
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: '-.04em',
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {promedio ?? '—'}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`${-padX} ${viewBoxY} ${size + padX * 2} ${viewBoxH}`} style={{ width: '100%', maxWidth: 620, height: 'auto' }}>
          {/* Grid rings */}
          {[2, 4, 6, 8, 10].map(level => (
            <polygon
              key={level}
              points={DIMENSIONES.map((_, i) => point(i, level).join(',')).join(' ')}
              fill="none"
              stroke="#0A0A0A"
              strokeOpacity={level === 10 ? 1 : 0.18}
              strokeWidth={level === 10 ? 1.5 : 1}
            />
          ))}

          {/* Axes */}
          {DIMENSIONES.map((dim, i) => {
            const [x, y] = point(i, 10)
            return (
              <line
                key={dim.id}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#0A0A0A"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
            )
          })}

          {/* Polygons per active role */}
          {ROL_ORDEN.filter(r => activos.has(r)).map(rol => {
            const vals = DIMENSIONES.map(d => promediosPorRol[rol]?.[d.id] ?? null)
            if (vals.some(v => v === null)) return null
            const pts = vals.map((v, i) => point(i, v as number).join(','))
            return (
              <g key={rol}>
                <polygon
                  points={pts.join(' ')}
                  fill={ROL_NEON[rol]}
                  fillOpacity={0.18}
                  stroke={ROL_NEON[rol]}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
                {vals.map((v, i) => {
                  const [px, py] = point(i, v as number)
                  return (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r={4}
                      fill={ROL_NEON[rol]}
                      stroke="#0A0A0A"
                      strokeWidth={1.5}
                    />
                  )
                })}
              </g>
            )
          })}

          {/* Dimension labels en cada esquina */}
          {DIMENSIONES.map((dim, i) => {
            const [x, y] = labelPos(i)
            const { textAnchor, dominantBaseline } = labelAnchor(i)
            return (
              <text
                key={dim.id}
                x={x}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
                fontSize="14"
                fontWeight="800"
                fill="#0A0A0A"
              >
                {dim.nombre}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
