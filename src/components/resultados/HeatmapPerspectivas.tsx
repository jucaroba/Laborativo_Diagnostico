'use client'

import { Fragment } from 'react'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'

const ROL_ORDEN: Rol[] = ['A', 'C', 'D', 'B']
const ROLES: Rol[] = ['A', 'B', 'C', 'D']

type Props = {
  promediosPorRol: Record<Rol, Record<number, number | null>>
}

export const cellAlpha = (val: number | null): number => {
  if (val === null) return 0
  const t = Math.max(0, Math.min(1, (val - 1) / 9))
  return 0.07 + t * 0.88
}

export const cellBg = (val: number | null): string => {
  if (val === null) return 'var(--bg-2)'
  return `rgba(10, 10, 10, ${cellAlpha(val).toFixed(3)})`
}

export const cellTextColor = (val: number | null): string => {
  if (val === null) return 'var(--mute)'
  return '#fff'
}

const round1 = (n: number) => Math.round(n * 10) / 10
const avg = (vals: number[]): number | null => {
  if (vals.length === 0) return null
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export default function HeatmapPerspectivas({ promediosPorRol }: Props) {
  const rolAvg = (rol: Rol): number | null =>
    avg(DIMENSIONES.map(d => promediosPorRol[rol]?.[d.id]).filter((v): v is number => typeof v === 'number'))

  const dimAvg = (dimId: number): number | null =>
    avg(ROLES.map(r => promediosPorRol[r]?.[dimId]).filter((v): v is number => typeof v === 'number'))

  const globalAvg: number | null = (() => {
    const vals: number[] = []
    for (const r of ROLES) for (const d of DIMENSIONES) {
      const v = promediosPorRol[r]?.[d.id]
      if (typeof v === 'number') vals.push(v)
    }
    return avg(vals)
  })()

  const cellNumberStyle = {
    padding: '24px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: '-.03em',
    fontVariantNumeric: 'tabular-nums' as const,
    lineHeight: 1,
  }

  const headerCellStyle = {
    padding: '14px 16px',
    textAlign: 'center' as const,
    background: 'var(--card)',
  }

  return (
    <div style={{ padding: '24px 56px 32px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px repeat(5, 1fr)',
        border: '1.5px solid var(--ink)',
      }}>
        {/* Header row */}
        <div style={{
          borderRight: '1.5px solid var(--ink)',
          borderBottom: '1.5px solid var(--ink)',
          padding: '14px 16px',
          background: 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
        }}>
          Mapa de calor
        </div>
        {DIMENSIONES.map((dim, i) => (
          <div key={dim.id} style={{
            ...headerCellStyle,
            borderRight: i === DIMENSIONES.length - 1 ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
            borderBottom: '1.5px solid var(--ink)',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
              {dim.subtitulo}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em', marginTop: 4, color: 'var(--ink)' }}>
              {dim.nombre}
            </div>
          </div>
        ))}
        {/* Promedio header */}
        <div style={{
          ...headerCellStyle,
          borderBottom: '1.5px solid var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em', color: 'var(--ink)' }}>
            Promedio
          </div>
        </div>

        {/* Body rows */}
        {ROL_ORDEN.map((rol, rowIdx) => {
          const rAvg = rolAvg(rol)
          const isLastRow = rowIdx === ROL_ORDEN.length - 1
          const rowBottom = isLastRow ? '3px solid var(--ink)' : '1.5px solid var(--ink)'
          return (
            <Fragment key={rol}>
              <div style={{
                borderRight: '1.5px solid var(--ink)',
                borderBottom: rowBottom,
                padding: '20px 16px 20px 31px',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--card)',
              }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: 'var(--ink)',
                  letterSpacing: '-.02em',
                }}>
                  {ROL_INFO[rol].label}
                </span>
              </div>
              {DIMENSIONES.map((dim, colIdx) => {
                const val = promediosPorRol[rol]?.[dim.id] ?? null
                const isLastCol = colIdx === DIMENSIONES.length - 1
                return (
                  <div key={dim.id} style={{
                    ...cellNumberStyle,
                    borderRight: isLastCol ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
                    borderBottom: rowBottom,
                    background: cellBg(val),
                    color: cellTextColor(val),
                  }}>
                    {val !== null ? val.toFixed(1) : '—'}
                  </div>
                )
              })}
              {/* Promedio del rol */}
              <div style={{
                ...cellNumberStyle,
                borderBottom: rowBottom,
                background: cellBg(rAvg),
                color: cellTextColor(rAvg),
              }}>
                {rAvg !== null ? rAvg.toFixed(1) : '—'}
              </div>
            </Fragment>
          )
        })}

        {/* Bottom row — promedios por dimensión */}
        <div style={{
          borderRight: '1.5px solid var(--ink)',
          padding: '20px 16px 20px 31px',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--card)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.02em' }}>
            Promedio
          </span>
        </div>
        {DIMENSIONES.map((dim, colIdx) => {
          const dAvg = dimAvg(dim.id)
          const isLastCol = colIdx === DIMENSIONES.length - 1
          return (
            <div key={dim.id} style={{
              ...cellNumberStyle,
              borderRight: isLastCol ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
              background: cellBg(dAvg),
              color: cellTextColor(dAvg),
            }}>
              {dAvg !== null ? dAvg.toFixed(1) : '—'}
            </div>
          )
        })}
        {/* Global avg corner */}
        <div style={{
          ...cellNumberStyle,
          background: cellBg(globalAvg),
          color: cellTextColor(globalAvg),
        }}>
          {globalAvg !== null ? globalAvg.toFixed(1) : '—'}
        </div>
      </div>

    </div>
  )
}
