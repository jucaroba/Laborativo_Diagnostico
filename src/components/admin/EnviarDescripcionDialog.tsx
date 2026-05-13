'use client'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Mail } from 'lucide-react'
import CopiarLink from './CopiarLink'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Fila = { nombre: string; email: string; valido: boolean; duplicado: boolean }

function parsear(texto: string): Fila[] {
  const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const vistos = new Set<string>()
  return lineas.map(linea => {
    const partes = linea.split(/\t|,|;/).map(p => p.trim()).filter(Boolean)
    const [nombre = '', email = ''] = partes
    const emailLower = email.toLowerCase()
    const duplicado = !!emailLower && vistos.has(emailLower)
    if (emailLower) vistos.add(emailLower)
    return {
      nombre,
      email: emailLower,
      valido: !!nombre && EMAIL_RE.test(emailLower),
      duplicado,
    }
  })
}

export default function EnviarDescripcionDialog({
  equipoId,
  linkUrl,
}: {
  equipoId: string
  linkUrl: string
}) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; fallidos: { email: string; error: string }[] } | null>(null)

  const filas = useMemo(() => parsear(texto), [texto])
  const validos = filas.filter(f => f.valido && !f.duplicado)

  async function enviar() {
    setEnviando(true)
    setResultado(null)
    try {
      const r = await fetch('/api/descripcion/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipoId,
          lista: validos.map(f => ({ nombre: f.nombre, email: f.email })),
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al enviar')
      setResultado({ enviados: data.enviados, fallidos: data.fallidos || [] })
    } catch (e: any) {
      setResultado({ enviados: 0, fallidos: [{ email: '—', error: e.message }] })
    } finally {
      setEnviando(false)
    }
  }

  function cerrar() {
    setOpen(false)
    setTimeout(() => {
      setTexto('')
      setResultado(null)
    }, 200)
  }

  return (
    <>
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            textDecoration: 'none',
            outline: 'none',
          }}
        >
          Descripción
        </a>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CopiarLink url={linkUrl} />
          <button
            onClick={() => setOpen(true)}
            title="Enviar link de descripción"
            aria-label="Enviar link de descripción"
            style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 4px', color: 'var(--ink)', display: 'flex' }}
          >
            <Mail size={16} strokeWidth={2} />
          </button>
        </span>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrar())}>
        <DialogContent style={{ maxWidth: 720, padding: '28px 32px 0' }}>
          <DialogHeader>
            <DialogTitle style={{ fontWeight: 800 }}>Enviar link de descripción:</DialogTitle>
            {!resultado && (
              <DialogDescription style={{ color: 'var(--ink)' }}>
                {`${filas.length} registro${filas.length === 1 ? '' : 's'} recibido${filas.length === 1 ? '' : 's'}.`}
              </DialogDescription>
            )}
          </DialogHeader>

          {!resultado && (
            <>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={'María Pérez\tmaria@empresa.com\nJuan López\tjuan@empresa.com'}
                style={{
                  width: '100%',
                  minHeight: 140,
                  padding: 12,
                  border: '1.5px solid var(--ink)',
                  fontFamily: "'Red Hat Display', sans-serif",
                  fontSize: 13,
                  resize: 'vertical',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                }}
              />

              {filas.length > 0 && (
                <div style={{ marginTop: 12, border: '1.5px solid var(--ink)', maxHeight: 240, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Nombre</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', width: 110 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f, i) => {
                        const estado = !f.valido ? 'Inválido' : f.duplicado ? 'Duplicado' : 'OK'
                        const color = !f.valido ? '#FF3366' : f.duplicado ? '#7A7A7A' : 'var(--ink)'
                        return (
                          <tr key={i} style={{ borderTop: '1px solid var(--line-soft)' }}>
                            <td style={{ padding: '6px 10px' }}>{f.nombre || <em style={{ color: '#FF3366' }}>(faltante)</em>}</td>
                            <td style={{ padding: '6px 10px' }}>{f.email || <em style={{ color: '#FF3366' }}>(faltante)</em>}</td>
                            <td style={{ padding: '6px 10px', color, fontWeight: 700 }}>{estado}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filas.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--mute)', margin: '10px 0 0', letterSpacing: '.04em' }}>
                  {validos.length} de {filas.length} listas para enviar.
                </p>
              )}
            </>
          )}

          {resultado && (
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
                {filas.length} registro{filas.length === 1 ? '' : 's'} recibido{filas.length === 1 ? '' : 's'}.
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>
                {resultado.enviados} link{resultado.enviados === 1 ? '' : 's'} enviado{resultado.enviados === 1 ? '' : 's'}.
              </p>
              {resultado.fallidos.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 6px', color: '#FF3366' }}>
                    {resultado.fallidos.length} fallaron:
                  </p>
                  <ul style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, paddingLeft: 18 }}>
                    {resultado.fallidos.map((f, i) => (
                      <li key={i}><strong>{f.email}</strong> — {f.error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <DialogFooter style={{ marginLeft: -32, marginRight: -32, marginBottom: 0, padding: '16px 32px' }}>
            {!resultado ? (
              <>
                <Button variant="outline" onClick={cerrar} disabled={enviando}>Cancelar</Button>
                <Button onClick={enviar} disabled={enviando || validos.length === 0}>
                  {enviando ? 'Enviando…' : `Enviar ${validos.length || ''} link${validos.length === 1 ? '' : 's'}`.trim()}
                </Button>
              </>
            ) : (
              <Button onClick={cerrar}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
