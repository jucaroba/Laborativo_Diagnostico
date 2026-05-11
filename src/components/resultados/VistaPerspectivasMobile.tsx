'use client'

import { useState } from 'react'
import { Rol360 as Rol } from "@/types"
import RadarPerspectivasMobile from './RadarPerspectivasMobile'
import HeatmapPerspectivasMobile from './HeatmapPerspectivasMobile'
import { cellBg } from './HeatmapPerspectivas'

type Vista = 'radar' | 'heatmap'

type Props = {
  promediosPorRol: Record<Rol, Record<number, number | null>>
  promedioGlobalPorRol: Record<Rol, number | null>
}

export default function VistaPerspectivasMobile({ promediosPorRol, promedioGlobalPorRol }: Props) {
  const [vista, setVista] = useState<Vista>('radar')

  return (
    <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
      <div style={{
        padding: '16px 20px 0',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div role="tablist" style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', alignSelf: 'flex-start' }}>
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
                  padding: '7px 14px',
                  background: activo ? 'var(--ink)' : 'transparent',
                  color: activo ? '#fff' : 'var(--ink)',
                  border: 'none',
                  borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
                  fontFamily: 'inherit',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
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
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase',
            color: 'var(--ink)', fontWeight: 700,
          }}>
            <span>Bajo</span>
            <div style={{ display: 'flex', border: '1.5px solid var(--ink)' }}>
              {[1, 2.5, 4, 5.5, 7, 8.5, 10].map(v => (
                <div key={v} style={{ width: 22, height: 12, background: cellBg(v) }} />
              ))}
            </div>
            <span>Alto</span>
          </div>
        )}
      </div>

      {vista === 'radar' ? (
        <RadarPerspectivasMobile
          promediosPorRol={promediosPorRol}
          promedioGlobalPorRol={promedioGlobalPorRol}
        />
      ) : (
        <HeatmapPerspectivasMobile promediosPorRol={promediosPorRol} />
      )}
    </div>
  )
}
