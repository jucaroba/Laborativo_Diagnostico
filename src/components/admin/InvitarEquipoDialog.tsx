'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

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

export default function InvitarEquipoDialog({ diagnosticoId }: { diagnosticoId: string }) {
  const router = useRouter()
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
      const r = await fetch('/api/invitaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticoId,
          lista: validos.map(f => ({ nombre: f.nombre, email: f.email })),
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al enviar')
      setResultado({ enviados: data.enviados, fallidos: data.fallidos || [] })
      router.refresh()
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
      <Button variant="outline" onClick={() => setOpen(true)}>Invitar equipo</Button>
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrar())}>
        <DialogContent style={{ maxWidth: 720 }}>
          <DialogHeader>
            <DialogTitle>Invitar al equipo</DialogTitle>
            <DialogDescription>
              Pega desde Excel dos columnas: <strong>nombre</strong> y <strong>email</strong>. Una persona por fila.
            </DialogDescription>
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

              <p style={{ fontSize: 11, color: 'var(--mute)', margin: '10px 0 0', letterSpacing: '.04em' }}>
                {filas.length === 0
                  ? 'Aceptamos separadores: tab, coma o punto y coma.'
                  : `${validos.length} de ${filas.length} listas para enviar.`}
              </p>
            </>
          )}

          {resultado && (
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>
                {resultado.enviados} invitación{resultado.enviados === 1 ? '' : 'es'} enviada{resultado.enviados === 1 ? '' : 's'}.
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

          <DialogFooter>
            {!resultado ? (
              <>
                <Button variant="outline" onClick={cerrar} disabled={enviando}>Cancelar</Button>
                <Button onClick={enviar} disabled={enviando || validos.length === 0}>
                  {enviando ? 'Enviando…' : `Enviar ${validos.length || ''} invitación${validos.length === 1 ? '' : 'es'}`.trim()}
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
