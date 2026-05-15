'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'
import IntakeFormMobile from './IntakeFormMobile'
import type { TipoDiagnostico } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

type Perfil = 'equipo' | 'lider'

const PERFILES = [
  { id: 'equipo' as Perfil, h: 'Miembro del equipo', p: 'Responderás desde tu experiencia como parte del equipo.\nIncluye tu auto-evaluación y tu mirada sobre el liderazgo que recibes.' },
  { id: 'lider' as Perfil, h: 'Líder del equipo', p: 'Responderás desde tu rol de liderazgo.\nIncluye tu auto-evaluación y tu mirada sobre el equipo que lideras.' },
]

export default function IntakeForm({ equipoId, nombreCompania, codigo, tipo = 'cultura_360', preguntasEquipo, preguntasLider, preguntasColectivo = 0 }: {
  equipoId: string
  nombreCompania: string
  codigo: string
  tipo?: TipoDiagnostico
  preguntasEquipo: number
  preguntasLider: number
  preguntasColectivo?: number
}) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(false)

  // En 360 el participante elige rol (equipo o líder). En el resto de tipos
  // todos responden el mismo set y se les asigna un rol único (típicamente 'X').
  const esSimple = tipo !== 'cultura_360'
  const rolUnico = TIPOS_DIAGNOSTICO[tipo].rolesParticipante[0] // 'X' para pulso y termómetro

  async function comenzar() {
    if (!esSimple && !perfil) return
    setLoading(true)

    const rol = esSimple ? rolUnico : perfil === 'equipo' ? 'A' : 'D'

    const { data: participante } = await supabase
      .from('participantes')
      .insert({ equipo_id: equipoId, rol })
      .select()
      .single()

    if (participante) {
      sessionStorage.setItem('pid', participante.id)
      sessionStorage.setItem('perfil', esSimple ? 'colectivo' : perfil!)
      router.push(`/d/${codigo}/q/1`)
    }
    setLoading(false)
  }

  return (
    <>
    <div className="only-mobile">
      <IntakeFormMobile
        nombreCompania={nombreCompania}
        tipo={tipo}
        preguntasEquipo={preguntasEquipo}
        preguntasLider={preguntasLider}
        preguntasColectivo={preguntasColectivo}
        perfil={perfil}
        setPerfil={setPerfil}
        loading={loading}
        onComenzar={comenzar}
      />
    </div>
    <div className="only-desktop" style={{ minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif", padding: '56px 56px 56px 106px', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg)', maxWidth: 870 }}>
      <span className="eyebrow">{esSimple ? 'Registro' : 'Paso 01 / 02 — Registro'}</span>
      <div className="rule" />
      <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, marginTop: 24, marginLeft: 100, textTransform: 'uppercase', letterSpacing: '.08em' }}>{nombreCompania}</div>
      <h2 style={{ fontWeight: 900, fontSize: 64, lineHeight: .92, letterSpacing: -1, marginLeft: 100 }}>
        {esSimple ? <>Antes de empezar,<br />unas notas rápidas.</> : <>Antes de empezar,<br />elige tu rol.</>}
      </h2>

      {esSimple ? (
        <>
          <div style={{ marginLeft: 100, fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', fontWeight: 500, maxWidth: '50ch' }}>
            {tipo === 'equipo_en_espejo'
              ? <>Vas a responder {preguntasColectivo} preguntas desde dos miradas: <strong>cómo te ves a ti</strong> y <strong>cómo ves al equipo</strong>. Sin respuestas correctas, tus respuestas son anónimas.</>
              : tipo === 'termometro_4'
              ? <>Vas a responder {preguntasColectivo} preguntas — una por cada dimensión de cultura. Toma menos de un minuto. Tus respuestas son anónimas y se promedian con las del resto del equipo.</>
              : <>Vas a responder {preguntasColectivo} preguntas sobre cómo se siente el equipo en las cuatro dimensiones de cultura. No hay respuestas correctas o incorrectas. Tus respuestas son anónimas y se promedian con las del resto del equipo.</>}
          </div>
          {/* Separador corto entre las dos notas */}
          <div aria-hidden style={{ marginLeft: 100, width: 42, height: 1.5, background: 'var(--ink)', marginTop: 16 }} />
          <p style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 500, margin: '8px 0 0', marginLeft: 100, maxWidth: '54ch' }}>
            Laborativo como tercero independiente revisará las respuestas, la compañía solo verá los resultados consolidados.
          </p>
          <div style={{ paddingTop: 8, marginLeft: 100 }}>
            <button onClick={comenzar} disabled={loading}
              className="btn primary"
              style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Cargando…' : <>Comenzar preguntas <ArrowRight size={15} strokeWidth={2.5} /></>}
            </button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <span className="eyebrow soft">
              ≈ {Math.max(2, Math.ceil(preguntasColectivo / 3))}–{Math.max(4, Math.ceil(preguntasColectivo / 2))} min · {preguntasColectivo} preguntas
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Rol */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, marginLeft: 100 }}>
            <div style={{ background: 'var(--ink)', padding: '10px 16px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Selecciona una de las dos opciones</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {PERFILES.map(p => (
                <div key={p.id}
                  onClick={() => setPerfil(p.id)}
                  style={{
                    border: '2px solid var(--ink)', padding: '16px 18px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    background: perfil === p.id ? 'var(--ink)' : 'var(--card)',
                    color: perfil === p.id ? 'var(--card)' : 'var(--ink)',
                    transition: 'all .15s',
                  }}>
                  <h5 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>{p.h}</h5>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'inherit', whiteSpace: 'pre-line' }}>{p.p}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 500, margin: '8px 0 0', marginLeft: 100, maxWidth: '54ch' }}>
            Laborativo como tercero independiente revisará las respuestas, la compañía solo verá los resultados consolidados.
          </p>
          <div style={{ paddingTop: 8, marginLeft: 100 }}>
            <button onClick={comenzar} disabled={!perfil || loading}
              className="btn primary"
              style={{ cursor: (!perfil || loading) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Cargando…' : <>Comenzar preguntas <ArrowRight size={15} strokeWidth={2.5} /></>}
            </button>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <span className="eyebrow soft">
              ≈ 5–8 min{perfil ? ` · ${perfil === 'lider' ? preguntasLider : preguntasEquipo} preguntas` : ''}
            </span>
          </div>
        </>
      )}
    </div>
    </>
  )
}
