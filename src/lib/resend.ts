import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

export async function enviarLinkParticipacion(params: {
  contactoEmail: string
  contactoNombre: string
  nombreCompania: string
  codigoParticipacion: string
}) {
  const { contactoEmail, contactoNombre, nombreCompania, codigoParticipacion } = params
  const link = `${BASE_URL}/d/${codigoParticipacion}`

  return getResend().emails.send({
    from: 'Laborativo <diagnostico@laborativo.com>',
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

export async function enviarInvitacionParticipante(params: {
  participanteEmail: string
  participanteNombre: string
  nombreCompania: string
  codigoParticipacion: string
}) {
  const { participanteEmail, participanteNombre, nombreCompania, codigoParticipacion } = params
  const link = `${BASE_URL}/d/${codigoParticipacion}`

  return getResend().emails.send({
    from: 'Laborativo <diagnostico@laborativo.com>',
    to: participanteEmail,
    subject: `Diagnóstico organizacional ${nombreCompania} — Tu invitación`,
    html: `
      <p>Hola ${participanteNombre},</p>
      <p>Estás invitado/a a participar en el diagnóstico organizacional de <strong>${nombreCompania}</strong>.</p>
      <p>Toma entre 12 y 18 minutos. Tus respuestas son anónimas y se usan para mapear las brechas de cultura del equipo.</p>
      <p><a href="${link}">Comenzar diagnóstico →</a></p>
      <p style="font-size: 13px; color: #666;">O copia este link: ${link}</p>
      <br/>
      <p>— Equipo Laborativo</p>
    `,
  })
}

export async function enviarLinkResultados(params: {
  contactoEmail: string
  contactoNombre: string
  nombreCompania: string
  codigoResultados: string
}) {
  const { contactoEmail, contactoNombre, nombreCompania, codigoResultados } = params
  const link = `${BASE_URL}/r/${codigoResultados}`

  return getResend().emails.send({
    from: 'Laborativo <diagnostico@laborativo.com>',
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
