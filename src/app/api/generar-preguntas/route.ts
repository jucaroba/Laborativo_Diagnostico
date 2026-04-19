import { NextRequest, NextResponse } from 'next/server'
import { generarPreguntas, buscarInfoEmpresa } from '@/lib/claude'
import { Rol } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { nombreCompania, vertical, contexto } = await req.json()

    const infoWeb = await buscarInfoEmpresa(nombreCompania)
    const grupos = await generarPreguntas({ nombreCompania, vertical, contexto, infoWeb })

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
