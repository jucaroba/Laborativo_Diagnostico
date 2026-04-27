'use client'

import { useState } from 'react'
import { Rol } from '@/types'
import RadarPerspectivas from './RadarPerspectivas'
import HeatmapPerspectivas, { cellBg } from './HeatmapPerspectivas'

type Vista = 'radar' | 'heatmap'

type Props = {
  promediosPorRol: Record<Rol, Record<number, number | null>>
  promedioGlobalPorRol: Record<Rol, number | null>
}

export default function VistaPerspectivas({ promediosPorRol, promedioGlobalPorRol }: Props) {
  const [vista, setVista] = useState<Vista>('radar')

  return (
    <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
      <div style={{
        padding: '20px 56px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
      }}>
        <div role="tablist" style={{ display: 'inline-flex', border: '1.5px solid var(--ink)' }}>
          {(['radar', 'heatmap'] as const).map((v, i) => {
            const activo = vista === v
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setVista(v)}
                style={{
                  padding: '8px 18px',
                  background: activo ? 'var(--ink)' : 'transparent',
                  color: activo ? '#fff' : 'var(--ink)',
                  border: 'none',
                  borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {v === 'radar' ? 'Radar' : 'Mapa de calor'}
              </button>
            )
          })}
        </div>

        {vista === 'heatmap' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 10,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            fontWeight: 700,
          }}>
            <span>Bajo</span>
            <div style={{ display: 'flex', border: '1.5px solid var(--ink)' }}>
              {[1, 2.5, 4, 5.5, 7, 8.5, 10].map(v => (
                <div key={v} style={{
                  width: 32,
                  height: 16,
                  background: cellBg(v),
                }} />
              ))}
            </div>
            <span>Alto</span>
          </div>
        )}
      </div>

      {vista === 'radar' ? (
        <RadarPerspectivas
          promediosPorRol={promediosPorRol}
          promedioGlobalPorRol={promedioGlobalPorRol}
        />
      ) : (
        <HeatmapPerspectivas promediosPorRol={promediosPorRol} />
      )}
    </div>
  )
}
