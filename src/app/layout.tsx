import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Laborativo Diagnóstico',
  description: 'Diagnóstico organizacional de cultura y brechas de liderazgo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
