import { Arquetipo } from '@/lib/arquetipos'

type Props = {
  brechas: Arquetipo
  relaciones: Arquetipo
}

export default function ArquetiposEquipoMobile({ brechas, relaciones }: Props) {
  const cards: Array<{ titulo: string; arquetipo: Arquetipo }> = [
    { titulo: 'Brechas entre perspectivas', arquetipo: brechas },
    { titulo: 'Relaciones entre dimensiones', arquetipo: relaciones },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderBottom: '1.5px solid var(--ink)',
      borderLeft: '1.5px solid var(--ink)',
      borderRight: '1.5px solid var(--ink)',
    }}>
      {cards.map((card, i) => {
        const a = card.arquetipo
        return (
          <article key={a.id} style={{
            borderBottom: i === 0 ? '1.5px solid var(--ink)' : 'none',
            display: 'flex', flexDirection: 'column',
          }}>
            <header style={{ padding: '20px 20px 14px' }}>
              <span className="eyebrow" style={{ fontSize: 10 }}>{a.tag} / {card.titulo}</span>
              <div className="rule" />
              <h3 style={{
                fontSize: 22, fontWeight: 900,
                letterSpacing: '-.02em', lineHeight: 1.05,
                margin: '12px 0 0', color: 'var(--ink)',
              }}>
                {a.titulo}
              </h3>
            </header>

            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <p style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.4, color: 'var(--ink)', margin: 0, letterSpacing: '-.01em' }}>
                {a.resumen}
              </p>

              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0, fontWeight: 500 }}>
                {a.cuerpo}
              </p>
            </div>

            <div style={{
              borderTop: '1.5px solid var(--ink)',
              padding: '12px 20px',
              fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase',
              color: 'var(--ink)', fontWeight: 700,
            }}>
              <span style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '2px 6px', marginRight: 8 }}>Patrón</span>
              {a.patron}
            </div>

            <footer style={{
              padding: '0 20px 14px',
              fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase',
              color: 'var(--ink)', fontWeight: 700,
            }}>
              <span style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '2px 6px', marginRight: 8 }}>Experiencia</span>
              {a.accion}
            </footer>
          </article>
        )
      })}
    </div>
  )
}
