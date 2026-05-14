'use client'

interface Props {
  value: string
  onChange: (c: string) => void
}

const HEX_RE = /^#[0-9A-F]{6}$/i

export default function ColorPickerHex({ value, onChange }: Props) {
  function handleText(v: string) {
    const t = v.trim()
    const next = t.startsWith('#') ? t : '#' + t
    onChange(next.toUpperCase())
  }

  const valido = HEX_RE.test(value)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={valido ? value : '#000000'}
        onChange={e => onChange(e.target.value.toUpperCase())}
        aria-label="Selector visual de color"
        className="color-swatch-flush"
        style={{
          width: 40, height: 36,
          border: '1.5px solid var(--ink)',
          padding: 0, background: 'transparent',
          cursor: 'pointer',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={e => handleText(e.target.value)}
        placeholder="#000000"
        maxLength={7}
        style={{
          width: 110, height: 36,
          border: '1.5px solid var(--ink)',
          padding: '0 10px', background: '#fff',
          color: 'var(--ink)', fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          outline: 'none', textTransform: 'uppercase',
        }}
      />
    </div>
  )
}
