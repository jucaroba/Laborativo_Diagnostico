'use client'

const NEONS = [
  { hex: '#39FF14', label: 'Verde'    },
  { hex: '#EEFF00', label: 'Amarillo' },
  { hex: '#FF6600', label: 'Naranja'  },
  { hex: '#FF3366', label: 'Rojo'     },
  { hex: '#FF2D78', label: 'Rosa'     },
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

      {/* Custom picker */}
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-sm cursor-pointer border-0 p-0 bg-transparent"
          style={{ outline: !isPreset ? '2px solid #000' : '2px solid transparent', outlineOffset: '2px' }}
        />
        <span className="text-xs font-mono" style={{ color: '#666' }}>
          {!isPreset ? value : 'Color personalizado →'}
        </span>

        {/* Preview */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: '#999' }}>Preview</span>
          <div className="px-3 py-1 text-xs font-bold" style={{ background: '#000', color: value }}>
            Laborativo
          </div>
        </div>
      </div>
    </div>
  )
}
