'use client'

import { Fragment } from 'react'
import { DIMENSIONES, ROL_INFO, Rol360 as Rol } from "@/types"
import { cellBg, cellTextColor } from './HeatmapPerspectivas'

const ROL_ORDEN: Rol[] = ['A', 'C', 'D', 'B']
const ROLES: Rol[] = ['A', 'B', 'C', 'D']

type Props = {
  promediosPorRol: Record<Rol, Record<number, number | null>>
}

const round1 = (n: number) => Math.round(n * 10) / 10
const avg = (vals: number[]): number | null => {
  if (vals.length === 0) return null
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export default function HeatmapPerspectivasMobile({ promediosPorRol }: Props) {
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
    padding: '12px 4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1,
  }

  const headerCellStyle = {
    padding: '8px 4px', textAlign: 'center' as const,
    background: 'var(--card)',
  }

  return (
    <div style={{ padding: '24px 20px 32px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '88px repeat(5, 1fr)',
        border: '1.5px solid var(--ink)',
      }}>
        {/* Header */}
        <div style={{
          borderRight: '1.5px solid var(--ink)',
          borderBottom: '1.5px solid var(--ink)',
          padding: '8px 4px', background: 'var(--card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2,
        }}>
          Mapa
        </div>
        {DIMENSIONES.map((dim, i) => (
          <div key={dim.id} style={{
            ...headerCellStyle,
            borderRight: i === DIMENSIONES.length - 1 ? '3px solid var(--ink)' : '1.5px solid var(--ink)',
            borderBottom: '1.5px solid var(--ink)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '-.01em', color: 'var(--ink)', lineHeight: 1.05 }}>
              {dim.nombre}
            </div>
          </div>
        ))}
        <div style={{
          ...headerCellStyle,
          borderBottom: '1.5px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '-.02em', color: 'var(--ink)' }}>Prom.</div>
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
                padding: '12px 6px', background: 'var(--card)',
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: 10.5, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
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

        {/* Bottom — promedios */}
        <div style={{
          borderRight: '1.5px solid var(--ink)',
          padding: '12px 6px', background: 'var(--card)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.02em' }}>Prom.</span>
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
