import NuevoDiagnosticoForm from '@/components/admin/NuevoDiagnosticoForm'

export default function NuevoDiagnosticoPage() {
  return (
    <div>
      <div className="page-header">
        <span className="page-header__eyebrow">Nuevo diagnóstico</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title">Configuración</h1>
        <p className="page-header__subtitle">Completa los datos del cliente y configura las preguntas antes de activar.</p>
      </div>
      <NuevoDiagnosticoForm />
    </div>
  )
}
