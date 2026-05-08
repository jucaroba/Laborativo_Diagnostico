import { NextRequest, NextResponse } from 'next/server'
import { regenerarArquetipo } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, promediosPorRol, promedioGlobalPorRol, promedioDim, deltaDim, actual } = body

    if (tipo !== 'brechas' && tipo !== 'relaciones') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }
    if (!promediosPorRol || !promedioGlobalPorRol || !promedioDim || !deltaDim || !actual) {
      return NextResponse.json({ error: 'Faltan datos del contexto' }, { status: 400 })
    }

    const fields = await regenerarArquetipo({
      tipo, promediosPorRol, promedioGlobalPorRol, promedioDim, deltaDim, actual,
    })

    return NextResponse.json(fields)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
