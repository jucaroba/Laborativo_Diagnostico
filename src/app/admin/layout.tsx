'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // El login se muestra sin el chrome del admin (ni sidebar ni header).
  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Red Hat Display', sans-serif" }}>
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" aria-label="Ir a Diagnósticos" style={{ display: 'inline-flex' }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} className="admin-header__logo" />
          </Link>
          <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Diagnóstico Admin</span>
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
