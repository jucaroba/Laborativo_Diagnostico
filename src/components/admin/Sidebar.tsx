'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Users, type LucideIcon } from 'lucide-react'

type Item = {
  label: string
  href: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

type Section = {
  items: Item[]
}

const SECTIONS: Section[] = [
  {
    items: [
      {
        label: 'Diagnósticos',
        href: '/admin',
        icon: LayoutGrid,
        match: p => p === '/admin'
          || (p.startsWith('/admin/')
            && !p.startsWith('/admin/preguntas-base')
            && !p.startsWith('/admin/usuarios')),
      },
    ],
  },
  {
    items: [
      {
        label: 'Preguntas base',
        href: '/admin/preguntas-base',
        icon: FileText,
        match: p => p.startsWith('/admin/preguntas-base'),
      },
      {
        label: 'Usuarios',
        href: '/admin/usuarios',
        icon: Users,
        match: p => p.startsWith('/admin/usuarios'),
      },
    ],
  },
]

export const SIDEBAR_WIDTH = 232

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: SIDEBAR_WIDTH,
      flexShrink: 0,
      borderRight: '1.5px solid var(--ink)',
      background: '#ffffff',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {SECTIONS.map((section, sIdx) => (
        <div key={sIdx}>
          {sIdx > 0 && (
            <div style={{
              height: 1,
              background: 'var(--ink)',
              opacity: 0.15,
              margin: '8px 16px 16px',
            }} />
          )}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {section.items.map(item => {
              const Icon = item.icon
              const active = item.match ? item.match(pathname ?? '') : pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 24px',
                      textDecoration: 'none',
                      color: 'var(--ink)',
                      background: 'transparent',
                      fontWeight: active ? 900 : 600,
                      fontSize: 14,
                      letterSpacing: '-.01em',
                      transition: 'font-weight .15s',
                    }}
                  >
                    <Icon size={16} strokeWidth={active ? 3 : 2} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
