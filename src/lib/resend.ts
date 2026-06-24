import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'
const FROM = 'Laborativo <diagnostico@laborativo.com>'

// Resend limita a 2 req/s y permite hasta 100 correos por request en la Batch
// API. Enviamos en lotes de 100 con una pausa entre lotes para no toparnos con
// el rate limit. (1 lote = 1 request, así un diagnóstico normal sale en una.)
const LOTE_MAX = 100
const PAUSA_LOTE_MS = 600

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Plantillas HTML ──
function htmlInvitacion(nombre: string, link: string, nombreCompania: string) {
  return `
      <p>Hola ${nombre},</p>
      <p>Estás invitado/a a participar en el diagnóstico de cultura organizacional de ${nombreCompania}.</p>
      <p>Toma entre 5 y 10 minutos. Este es tu link personal, no lo compartas.</p>
      <p>Tus respuestas son confidenciales, tu empresa solo verá los resultados consolidados del equipo. Laborativo, como tercero independiente, conserva el detalle de forma reservada para análisis.</p>
      <p><a href="${link}" style="font-weight: 700;">Comenzar diagnóstico →</a></p>
      <div style="width: 40px; border-top: 3px solid #0A0A0A; margin: 20px 0;"></div>
      <p>Gracias por tu ayuda :)<br/>Equipo Laborativo.</p>
    `
}

function linkIntake(codigoParticipacion: string, token?: string) {
  // Link personalizado: el token identifica a la persona al iniciar el cuestionario.
  return `${BASE_URL}/d/${codigoParticipacion}/intake${token ? `?t=${token}` : ''}`
}

// ── Envío por lotes (Batch API) ──
// Cada `ref` es el identificador con el que el llamador correlaciona el resultado
// (p. ej. el id de la invitación). Revisa el error real de Resend: lo que no se
// pudo enviar queda en `fallidos`, nunca se da por enviado en silencio.
type CorreoLote = { ref: string; to: string; subject: string; html: string }

async function enviarLote(correos: CorreoLote[]): Promise<{ enviados: string[]; fallidos: { ref: string; error: string }[] }> {
  const resend = getResend()
  const enviados: string[] = []
  const fallidos: { ref: string; error: string }[] = []

  for (let i = 0; i < correos.length; i += LOTE_MAX) {
    const grupo = correos.slice(i, i + LOTE_MAX)
    try {
      const res = await resend.batch.send(
        grupo.map(c => ({ from: FROM, to: c.to, subject: c.subject, html: c.html })),
        { batchValidation: 'permissive' },
      )
      if (res.error) {
        // Falló la request completa → ninguno del grupo salió.
        for (const c of grupo) fallidos.push({ ref: c.ref, error: res.error.message })
      } else {
        // En modo permissive, `errors` trae los rechazados por índice; el resto salió.
        const errores = ((res.data as { errors?: { index: number; message: string }[] })?.errors) ?? []
        const errPorIdx = new Map(errores.map(e => [e.index, e.message]))
        grupo.forEach((c, idx) => {
          const err = errPorIdx.get(idx)
          if (err) fallidos.push({ ref: c.ref, error: err })
          else enviados.push(c.ref)
        })
      }
    } catch (err) {
      for (const c of grupo) fallidos.push({ ref: c.ref, error: err instanceof Error ? err.message : String(err) })
    }
    if (i + LOTE_MAX < correos.length) await sleep(PAUSA_LOTE_MS)
  }

  return { enviados, fallidos }
}

/** Invitaciones de participación, en lote. `ref` devuelto = invitacionId. */
export function enviarInvitacionesLote(
  items: { invitacionId: string; email: string; nombre: string; nombreCompania: string; codigoParticipacion: string; token?: string }[],
) {
  return enviarLote(items.map(it => ({
    ref: it.invitacionId,
    to: it.email,
    subject: `Participa en el diagnóstico de cultura de ${it.nombreCompania}`,
    html: htmlInvitacion(it.nombre, linkIntake(it.codigoParticipacion, it.token), it.nombreCompania),
  })))
}

/** Links de descripción del proyecto, en lote. `ref` devuelto = email. */
export function enviarLinksDescripcionLote(
  items: { email: string; nombre: string; nombreCompania: string; codigoParticipacion: string }[],
) {
  return enviarLote(items.map(it => ({
    ref: it.email,
    to: it.email,
    subject: `Diagnóstico organizacional ${it.nombreCompania} — Descripción del proyecto`,
    html: `
      <p>Hola ${it.nombre},</p>
      <p>Acá está la descripción del diagnóstico organizacional para <strong>${it.nombreCompania}</strong>.</p>
      <p>Conoce las cuatro dimensiones, las miradas y el paso a paso del proceso:</p>
      <p><a href="${BASE_URL}/d/${it.codigoParticipacion}">Ver descripción del diagnóstico →</a></p>
      <p style="font-size: 13px; color: #666;">O copia este link: ${BASE_URL}/d/${it.codigoParticipacion}</p>
      <br/>
      <p>— Equipo Laborativo</p>
    `,
  })))
}

// ── Envíos individuales (1 destinatario) ──
// Revisan el error de Resend y lanzan si falla, para no marcar como enviado algo
// que no salió.
async function enviarUno(opts: { to: string; subject: string; html: string }) {
  const res = await getResend().emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html })
  if (res.error) throw new Error(res.error.message)
  return res.data
}

export function enviarLinkParticipacion(params: {
  contactoEmail: string
  contactoNombre: string
  nombreCompania: string
  codigoParticipacion: string
}) {
  const { contactoEmail, contactoNombre, nombreCompania, codigoParticipacion } = params
  const link = `${BASE_URL}/d/${codigoParticipacion}`
  return enviarUno({
    to: contactoEmail,
    subject: `Diagnóstico organizacional ${nombreCompania} — Link de participación`,
    html: `
      <p>Hola ${contactoNombre},</p>
      <p>Está listo el diagnóstico organizacional para <strong>${nombreCompania}</strong>.</p>
      <p>Comparte este link con los participantes:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Cada persona selecciona su rol al ingresar y responde desde su perspectiva.</p>
      <br/>
      <p>— Equipo Laborativo</p>
    `,
  })
}

export function enviarInvitacionParticipante(params: {
  participanteEmail: string
  participanteNombre: string
  nombreCompania: string
  codigoParticipacion: string
  /** Token de la invitación: hace el link personalizado y enlaza las respuestas con la persona. */
  token?: string
}) {
  const { participanteEmail, participanteNombre, nombreCompania, codigoParticipacion, token } = params
  return enviarUno({
    to: participanteEmail,
    subject: `Participa en el diagnóstico de cultura de ${nombreCompania}`,
    html: htmlInvitacion(participanteNombre, linkIntake(codigoParticipacion, token), nombreCompania),
  })
}

export function enviarLinkDescripcion(params: {
  participanteEmail: string
  participanteNombre: string
  nombreCompania: string
  codigoParticipacion: string
}) {
  const { participanteEmail, participanteNombre, nombreCompania, codigoParticipacion } = params
  const link = `${BASE_URL}/d/${codigoParticipacion}`
  return enviarUno({
    to: participanteEmail,
    subject: `Diagnóstico organizacional ${nombreCompania} — Descripción del proyecto`,
    html: `
      <p>Hola ${participanteNombre},</p>
      <p>Acá está la descripción del diagnóstico organizacional para <strong>${nombreCompania}</strong>.</p>
      <p>Conoce las cuatro dimensiones, las miradas y el paso a paso del proceso:</p>
      <p><a href="${link}">Ver descripción del diagnóstico →</a></p>
      <p style="font-size: 13px; color: #666;">O copia este link: ${link}</p>
      <br/>
      <p>— Equipo Laborativo</p>
    `,
  })
}

export function enviarLinkResultados(params: {
  contactoEmail: string
  contactoNombre: string
  nombreCompania: string
  codigoResultados: string
}) {
  const { contactoEmail, contactoNombre, nombreCompania, codigoResultados } = params
  const link = `${BASE_URL}/r/${codigoResultados}`
  return enviarUno({
    to: contactoEmail,
    subject: `Diagnóstico ${nombreCompania} — Resultados disponibles`,
    html: `
      <p>Hola ${contactoNombre},</p>
      <p>Los resultados del diagnóstico organizacional de <strong>${nombreCompania}</strong> ya están disponibles.</p>
      <p><a href="${link}">Ver resultados →</a></p>
      <br/>
      <p>— Equipo Laborativo</p>
    `,
  })
}
