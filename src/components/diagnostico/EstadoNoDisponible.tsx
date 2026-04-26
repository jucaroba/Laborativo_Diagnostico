import Image from 'next/image'

type Estado = 'borrador' | 'completado' | 'no-encontrado'

type Props = {
  estado: Estado
  nombreCompania?: string
  neon?: string
}

const COPY: Record<Estado, { eyebrow: string | null; titulo: string | null; mensaje: string }> = {
  borrador: {
    eyebrow: 'Aún no disponible',
    titulo: 'Este diagnóstico\ntodavía no está activo.',
    mensaje: 'Recibirás el enlace de inicio por correo cuando tu organización lo active.\nSi crees que esto es un error contacta a Laborativo.\nlinamaria@laborativo.com.',
  },
  completado: {
    eyebrow: null,
    titulo: 'Diagnóstico\ncerrado.',
    mensaje: 'La fase de respuestas terminó y los resultados ya fueron entregados.\nSi necesitas acceso al reporte contacta a Laborativo.\nlinamaria@laborativo.com.',
  },
  'no-encontrado': {
    eyebrow: 'Enlace no válido',
    titulo: 'No encontramos\nlo que buscabas.',
    mensaje: 'El enlace que ingresaste no corresponde a un diagnóstico válido.\nVerifica con quien te lo compartió o contacta a Laborativo.\nlinamaria@laborativo.com.',
  },
}

export default function EstadoNoDisponible({ estado, nombreCompania, neon = '#D8FF00' }: Props) {
  const copy = COPY[estado]
  const eyebrow = copy.eyebrow ?? nombreCompania ?? 'Diagnóstico'
  const titulo = copy.titulo ?? nombreCompania ?? 'Diagnóstico'

  return (
    <div style={{ ['--neon' as string]: neon, background: 'var(--bg)', minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif", display: 'flex', flexDirection: 'column' }}>

      <div style={{ padding: '48px 56px 32px', borderBottom: '1.5px solid var(--ink)' }}>
        <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={200} height={51} style={{ objectFit: 'contain', display: 'block', marginLeft: -15, marginTop: 15 }} />
      </div>

      <div style={{ padding: '96px 56px 96px 156px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 980 }}>
        <span className="eyebrow">{eyebrow}</span>
        <div className="rule" />
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px,6.5vw,88px)', lineHeight: .9, letterSpacing: '-.035em', margin: '24px 0 32px', whiteSpace: 'pre-line' }}>
          {titulo}
        </h1>
        {copy.eyebrow && nombreCompania && (
          <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 700, marginBottom: 24 }}>
            {nombreCompania}
          </span>
        )}
        <p style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: '52ch', margin: 0, fontWeight: 500, whiteSpace: 'pre-line' }}>
          {copy.mensaje}
        </p>
      </div>

      <div style={{ padding: '24px 56px', borderTop: '1.5px solid var(--ink)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mute)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>
        <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
        <span>Diag · V1.0</span>
      </div>

    </div>
  )
}
