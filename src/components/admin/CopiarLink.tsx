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
    <button
      onClick={copiar}
      title="Copiar link"
      aria-label="Copiar link"
      style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: copiado ? '#3D6B4F' : 'var(--ink)', display: 'flex' }}
    >
      {copiado ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} strokeWidth={2} />}
    </button>
  )
}
