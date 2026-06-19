'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// useSearchParams obliga a un límite de Suspense para el prerender del build.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEntrando(true)
    try {
      const supabase = createSupabaseBrowser()
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      // La sesión queda en cookies; el middleware ya verá al usuario.
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
      setEntrando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', fontFamily: "'Red Hat Display', sans-serif", padding: 24 }}>
      <form onSubmit={entrar} style={{ width: '100%', maxWidth: 380, background: 'var(--card)', border: '1.5px solid var(--ink)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <span className="page-header__eyebrow">Laborativo</span>
          <div className="page-header__rule" />
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.01em', margin: '8px 0 0', fontFamily: 'Red Hat Display, sans-serif' }}>Diagnóstico Admin</h1>
          <p style={{ fontSize: 13, color: 'var(--mute)', margin: '6px 0 0' }}>Inicia sesión para continuar.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label className="form-label" htmlFor="email">Correo</Label>
          <Input id="email" type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@laborativo.com" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label className="form-label" htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && (
          <p style={{ fontSize: 12, fontWeight: 700, color: '#FF3366', margin: 0 }}>{error}</p>
        )}

        <Button type="submit" className="btn primary" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
