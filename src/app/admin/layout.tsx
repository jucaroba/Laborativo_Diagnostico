'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Red Hat Display', sans-serif" }}>
      <header style={{ borderBottom: '1.5px solid var(--ink)', background: 'var(--bg)', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--mute)', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.04em' }}>Diagnóstico Admin</span>
        </div>
        {pathname !== '/admin' && (
          <Link href="/admin" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em', textDecoration: 'none' }}>
            ← Diagnósticos
          </Link>
        )}
      </header>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 40px' }}>{children}</main>
    </div>
  )
}
