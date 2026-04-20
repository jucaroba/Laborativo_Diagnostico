import NuevoDiagnosticoForm from '@/components/admin/NuevoDiagnosticoForm'

export default function NuevoDiagnosticoPage() {
  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, margin: '0 0 10px' }}>Nuevo diagnóstico</p>
          <div style={{ width: 24, height: 2, background: 'var(--ink)', marginBottom: 12 }} />
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, margin: 0 }}>Configuración</h1>
        </div>
      </div>
      <NuevoDiagnosticoForm />
    </div>
  )
}
