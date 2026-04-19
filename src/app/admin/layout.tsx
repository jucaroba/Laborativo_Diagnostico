'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--black)', background: 'var(--bg)' }}
        className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-black text-sm tracking-widest uppercase">Laborativo</span>
          <span style={{ color: 'var(--gray-border)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--gray-mid)' }}>Diagnóstico Admin</span>
        </div>
        {pathname !== '/admin' && (
          <Link href="/admin" className="text-sm font-bold hover:opacity-60 transition-opacity">
            ← Diagnósticos
          </Link>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-8 py-10">{children}</main>
    </div>
  )
}
