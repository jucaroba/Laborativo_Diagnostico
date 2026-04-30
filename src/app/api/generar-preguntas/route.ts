import { NextRequest, NextResponse } from 'next/server'
import { generarPreguntas } from '@/lib/claude'
import { Rol } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { tema, vertical, contexto } = await req.json()

    if (!tema || typeof tema !== 'string') {
      return NextResponse.json({ error: 'Falta el tema' }, { status: 400 })
    }

    const grupos = await generarPreguntas({ tema, vertical: vertical ?? '', contexto: contexto ?? '' })

    const preguntas: { dimension_id: number; rol: Rol; texto: string; orden: number }[] = []
    let orden = 0
    for (const grupo of grupos) {
      for (const texto of grupo.preguntas) {
        preguntas.push({ dimension_id: grupo.dimension_id, rol: grupo.rol, texto, orden: orden++ })
      }
    }

    return NextResponse.json({ preguntas })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
