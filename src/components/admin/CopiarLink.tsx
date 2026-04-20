'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <p style={{ fontSize: 13, wordBreak: 'break-all', fontWeight: 500, margin: 0 }}>{url}</p>
      <button
        onClick={copiar}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: copiado ? '#3D6B4F' : '#7A7A7A', display: 'flex' }}
      >
        {copiado ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
      </button>
    </div>
  )
}
