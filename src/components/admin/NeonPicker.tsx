'use client'

const NEONS = [
  { hex: '#39FF14', label: 'Verde'    },
  { hex: '#EEFF00', label: 'Amarillo' },
  { hex: '#FF6600', label: 'Naranja'  },
  { hex: '#FF3366', label: 'Rojo'     },
  { hex: '#00FFFF', label: 'Cyan'     },
  { hex: '#BF00FF', label: 'Púrpura'  },
  { hex: '#CCFF00', label: 'Lima'     },
]

export default function NeonPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const isPreset = NEONS.some(n => n.hex.toLowerCase() === value.toLowerCase())

  return (
    <div className="flex flex-col gap-3">
      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {NEONS.map(n => (
          <button key={n.hex} type="button" title={n.label}
            onClick={() => onChange(n.hex)}
            className="w-8 h-8 rounded-sm transition-all"
            style={{
              background: n.hex,
              outline: value.toLowerCase() === n.hex.toLowerCase() ? `2px solid #000` : '2px solid transparent',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>

    </div>
  )
}
