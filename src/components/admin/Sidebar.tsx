'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Users, Layers, type LucideIcon } from 'lucide-react'

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
            && !p.startsWith('/admin/usuarios')
            && !p.startsWith('/admin/grupos')),
      },
      {
        label: 'Grupos',
        href: '/admin/grupos',
        icon: Layers,
        match: p => p.startsWith('/admin/grupos'),
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
    <aside className="admin-sidebar">
      {SECTIONS.map((section, sIdx) => (
        <div key={sIdx} className="admin-sidebar__section">
          {sIdx > 0 && <div className="admin-sidebar__divider" />}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }} className="admin-sidebar__list">
            {section.items.map(item => {
              const Icon = item.icon
              const active = item.match ? item.match(pathname ?? '') : pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`admin-sidebar__link${active ? ' admin-sidebar__link--active' : ''}`}
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
