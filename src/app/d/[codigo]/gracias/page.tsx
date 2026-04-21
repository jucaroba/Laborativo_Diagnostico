export default function GraciasPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 56, fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)' }}>
      <span className="eyebrow">Diagnóstico completado</span>
      <div className="rule" style={{ margin: '12px auto 0' }} />
      <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px,6vw,88px)', lineHeight: .88, letterSpacing: '-.02em', textAlign: 'center', margin: '32px 0 24px', maxWidth: '14ch' }}>
        Gracias por tu participación.
      </h1>
      <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: '44ch', textAlign: 'center', fontWeight: 500, margin: 0 }}>
        Tus respuestas quedaron registradas.<br />Revisaremos las respuestas y evaluaremos la información una vez todas las personas hayan finalizado.
      </p>
    </div>
  )
}
