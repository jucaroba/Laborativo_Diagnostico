import NuevoDiagnosticoForm from '@/components/admin/NuevoDiagnosticoForm'

export default function NuevoDiagnosticoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-2" style={{ color: 'var(--brown)' }}>Nuevo diagnóstico</h1>
      <p className="text-sm font-sans mb-8" style={{ color: 'var(--brown-light)' }}>
        Completa los datos del cliente y configura las preguntas antes de activar.
      </p>
      <NuevoDiagnosticoForm />
    </div>
  )
}
