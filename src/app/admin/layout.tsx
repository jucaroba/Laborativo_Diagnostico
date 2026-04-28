'use client'
import Image from 'next/image'
import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Red Hat Display', sans-serif" }}>
      <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
          <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Diagnóstico Admin</span>
        </div>
      </header>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 40px' }}>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
