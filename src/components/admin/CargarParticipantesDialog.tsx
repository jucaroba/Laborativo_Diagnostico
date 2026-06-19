'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Users } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Fila = { nombre: string; email: string; area: string; perfil: 'lider' | 'miembro'; valido: boolean; duplicado: boolean }

function normPerfil(v: string): 'lider' | 'miembro' {
  const s = v.trim().toLowerCase()
  return s.startsWith('líd') || s.startsWith('lid') || s.startsWith('lead') || s === 'l' ? 'lider' : 'miembro'
}

function parsear(texto: string): Fila[] {
  const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const vistos = new Set<string>()
  return lineas.map(linea => {
    const partes = linea.split(/\t|,|;/).map(p => p.trim())
    const [nombre = '', email = '', area = '', rol = ''] = partes
    const emailLower = email.toLowerCase()
    const duplicado = !!emailLower && vistos.has(emailLower)
    if (emailLower) vistos.add(emailLower)
    return {
      nombre,
      email: emailLower,
      area: area || 'General',
      perfil: normPerfil(rol),
      valido: !!nombre && EMAIL_RE.test(emailLower),
      duplicado,
    }
  })
}

export default function CargarParticipantesDialog({ diagnosticoId, variant = 'button' }: { diagnosticoId: string; variant?: 'button' | 'primary' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ areas: number; equiposCreados: number; invitaciones: number; enviados: number; fallidos: { email: string; error: string }[] } | null>(null)

  const filas = useMemo(() => parsear(texto), [texto])
  const validos = filas.filter(f => f.valido && !f.duplicado)
  const areas = [...new Set(validos.map(f => f.area))]

  async function enviar() {
    setEnviando(true)
    setResultado(null)
    try {
      const r = await fetch('/api/invitaciones/cargar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosticoId, lista: validos.map(f => ({ nombre: f.nombre, email: f.email, area: f.area, perfil: f.perfil })) }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al cargar')
      setResultado(data)
      router.refresh()
    } catch (e) {
      setResultado({ areas: 0, equiposCreados: 0, invitaciones: 0, enviados: 0, fallidos: [{ email: '—', error: e instanceof Error ? e.message : 'Error' }] })
    } finally {
      setEnviando(false)
    }
  }

  function cerrar() {
    setOpen(false)
    setTimeout(() => { setTexto(''); setResultado(null) }, 200)
  }

  return (
    <>
      {variant === 'primary' ? (
        <Button onClick={() => setOpen(true)}>
          <Users size={14} strokeWidth={2.5} /> Cargar participantes
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} style={{ background: '#fff', color: 'var(--ink)', border: '1.5px solid #fff' }}>
          <Users size={14} strokeWidth={2.5} /> Cargar participantes
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrar())}>
        <DialogContent style={{ maxWidth: 820, padding: '28px 32px 0' }}>
          <DialogHeader>
            <DialogTitle style={{ fontWeight: 800 }}>Cargar participantes por área</DialogTitle>
            {!resultado && (
              <DialogDescription style={{ color: 'var(--ink)' }}>
                Pega la lista: <strong>nombre · email · área · rol</strong> (rol = líder o miembro). Se crea un equipo por cada área y se envía a cada persona su link personal.
              </DialogDescription>
            )}
          </DialogHeader>

          {!resultado && (
            <>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={'Ana Pérez\tana@empresa.com\tVentas\tmiembro\nLucía Gómez\tlucia@empresa.com\tVentas\tlíder\nCarlos Ruiz\tcarlos@empresa.com\tOperaciones\tmiembro'}
                style={{ width: '100%', minHeight: 150, padding: 12, border: '1.5px solid var(--ink)', fontFamily: "'Red Hat Display', sans-serif", fontSize: 13, resize: 'vertical', background: 'var(--bg)', color: 'var(--ink)' }}
              />

              {filas.length > 0 && (
                <div style={{ marginTop: 12, border: '1.5px solid var(--ink)', maxHeight: 260, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                        {['Nombre', 'Email', 'Área', 'Rol', 'Estado'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
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
                            <td style={{ padding: '6px 10px' }}>{f.area}</td>
                            <td style={{ padding: '6px 10px', fontWeight: 700 }}>{f.perfil === 'lider' ? 'Líder' : 'Miembro'}</td>
                            <td style={{ padding: '6px 10px', color, fontWeight: 700 }}>{estado}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {validos.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--mute)', margin: '10px 0 0', letterSpacing: '.04em' }}>
                  {validos.length} listas · {areas.length} equipo{areas.length === 1 ? '' : 's'} ({areas.join(', ')})
                </p>
              )}
            </>
          )}

          {resultado && (
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
                {resultado.equiposCreados} equipo{resultado.equiposCreados === 1 ? '' : 's'} creado{resultado.equiposCreados === 1 ? '' : 's'} · {resultado.invitaciones} invitación{resultado.invitaciones === 1 ? '' : 'es'}.
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                {resultado.enviados} correo{resultado.enviados === 1 ? '' : 's'} enviado{resultado.enviados === 1 ? '' : 's'}.
              </p>
              {resultado.fallidos.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 6px', color: '#FF3366' }}>{resultado.fallidos.length} fallaron:</p>
                  <ul style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, paddingLeft: 18 }}>
                    {resultado.fallidos.map((f, i) => (<li key={i}><strong>{f.email}</strong> — {f.error}</li>))}
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
                  {enviando ? 'Cargando…' : `Crear equipos y enviar (${validos.length})`}
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
