'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <header style={{ borderBottom: '1px solid var(--cream-dark)', background: 'var(--cream)' }}
        className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-sans tracking-widest uppercase" style={{ color: 'var(--brown-light)' }}>
            Laborativo
          </span>
          <span style={{ color: 'var(--cream-dark)' }}>/</span>
          <span className="text-sm font-sans" style={{ color: 'var(--brown-mid)' }}>Admin</span>
        </div>
        {pathname !== '/admin' && (
          <Link href="/admin"
            className="text-sm font-sans hover:opacity-70 transition-opacity"
            style={{ color: 'var(--brown-mid)' }}>
            ← Diagnósticos
          </Link>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-8 py-10">{children}</main>
    </div>
  )
}
