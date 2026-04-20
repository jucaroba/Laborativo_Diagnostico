import NuevoDiagnosticoForm from '@/components/admin/NuevoDiagnosticoForm'

export default function NuevoDiagnosticoPage() {
  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif" }}>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, margin: '0 0 10px' }}>Nuevo</p>
        <div style={{ width: 24, height: 2, background: 'var(--ink)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, margin: '0 0 8px' }}>Nuevo diagnóstico</h1>
        <p style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: 0 }}>
          Completa los datos del cliente y configura las preguntas antes de activar.
        </p>
      </div>
      <NuevoDiagnosticoForm />
    </div>
  )
}
