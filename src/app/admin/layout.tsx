'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Sidebar from '@/components/admin/Sidebar'

const STATIC_SEGS = new Set(['nuevo', 'usuarios', 'preguntas-base', 'login'])

// Destino de "volver" para el breadcrumb del header, según la ruta actual.
// `null` en el nivel raíz (no aplica volver) → se muestra como texto plano.
function backTarget(pathname: string): { href: string; label: string } | null {
  const segs = pathname.split('/').filter(Boolean) // ['admin', ...]
  if (segs.length <= 1) return null // /admin (listado)

  // /admin/preguntas-base/[temaId] → vuelve a Preguntas base
  if (segs[1] === 'preguntas-base' && segs.length >= 3) return { href: '/admin/preguntas-base', label: 'Preguntas base' }

  // /admin/[id]/respuestas/[equipoId] → vuelve al diagnóstico
  if (!STATIC_SEGS.has(segs[1]) && segs[2] === 'respuestas') return { href: `/admin/${segs[1]}`, label: 'Diagnóstico' }

  // Resto de subpáginas de primer nivel → vuelven al listado
  return { href: '/admin', label: 'Diagnósticos' }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // El login se muestra sin el chrome del admin (ni sidebar ni header).
  if (pathname === '/admin/login') return <>{children}</>

  const back = backTarget(pathname)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Red Hat Display', sans-serif" }}>
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" aria-label="Ir a Diagnósticos" style={{ display: 'inline-flex' }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} className="admin-header__logo" />
          </Link>
          <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
          {back ? (
            <Link
              href={back.href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5, textDecoration: 'none' }}
            >
              <ArrowLeft size={13} strokeWidth={2.5} /> {back.label}
            </Link>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Diagnóstico Admin</span>
          )}
        </div>
      </header>
      <div className="admin-shell">
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="admin-content">
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
