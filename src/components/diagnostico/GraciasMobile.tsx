export default function GraciasMobile() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 20px', fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)',
    }}>
      <span className="eyebrow">Diagnóstico completado</span>
      <div className="rule" />
      <h1 style={{
        fontWeight: 900,
        fontSize: 'clamp(36px, 10vw, 56px)',
        lineHeight: .92, letterSpacing: '-.02em',
        margin: '24px 0 20px',
      }}>
        Gracias por tu participación.
      </h1>
      <p style={{
        fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.5,
        fontWeight: 500, margin: 0,
      }}>
        Tus respuestas quedaron registradas.<br />
        Revisaremos las respuestas y evaluaremos la información una vez todas las personas hayan finalizado.
      </p>
    </div>
  )
}
