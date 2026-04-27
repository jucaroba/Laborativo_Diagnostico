import { Arquetipo } from '@/lib/arquetipos'

type Props = {
  brechas: Arquetipo
  relaciones: Arquetipo
  neonColor: string
}

export default function ArquetiposEquipo({ brechas, relaciones, neonColor }: Props) {
  const cards: Array<{ titulo: string; arquetipo: Arquetipo }> = [
    { titulo: 'Brechas entre perspectivas', arquetipo: brechas },
    { titulo: 'Relaciones entre dimensiones', arquetipo: relaciones },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      borderBottom: '1.5px solid var(--ink)',
      borderLeft: '1.5px solid var(--ink)',
      borderRight: '1.5px solid var(--ink)',
    }}>
      {cards.map((card, i) => {
        const a = card.arquetipo
        return (
          <article key={a.id} style={{
            borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <header style={{ padding: '28px 32px 20px' }}>
              <span className="eyebrow">{a.tag} / {card.titulo}</span>
              <div className="rule" />
              <h3 style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: '-.02em',
                lineHeight: 1.05,
                margin: '16px 0 0',
                color: 'var(--ink)',
              }}>
                {a.titulo}
              </h3>
            </header>

            <div style={{ padding: '0 32px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4, color: 'var(--ink)', margin: 0, letterSpacing: '-.01em' }}>
                {a.resumen}
              </p>

              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, fontWeight: 500 }}>
                {a.cuerpo}
              </p>
            </div>

            <div style={{
              borderTop: '1.5px solid var(--ink)',
              padding: '16px 32px',
              fontSize: 10,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              fontWeight: 700,
              marginTop: 'auto',
            }}>
              <span style={{ background: neonColor, color: 'var(--ink)', padding: '2px 6px', marginRight: 8 }}>Patrón</span>
              {a.patron}
            </div>

            <footer style={{
              padding: '0 32px 16px',
              fontSize: 10,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              fontWeight: 700,
            }}>
              <span style={{ background: neonColor, color: 'var(--ink)', padding: '2px 6px', marginRight: 8 }}>Experiencia</span>
              {a.accion}
            </footer>
          </article>
        )
      })}
    </div>
  )
}
