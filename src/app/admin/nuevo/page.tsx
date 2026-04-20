import NuevoDiagnosticoForm from '@/components/admin/NuevoDiagnosticoForm'

export default function NuevoDiagnosticoPage() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <span className="page-header__eyebrow">Nuevo diagnóstico</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title">Configuración</h1>
      </div>
      <div style={{ maxWidth: 720 }}>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Características del diagnóstico</h2>
        </div>
        <NuevoDiagnosticoForm />
      </div>
    </div>
  )
}
