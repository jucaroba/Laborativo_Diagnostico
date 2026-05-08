import { NextRequest, NextResponse } from 'next/server'
import { regenerarArquetipo } from '@/lib/claude'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, diagnosticoId, promediosPorRol, promedioGlobalPorRol, promedioDim, deltaDim, actual } = body

    if (tipo !== 'brechas' && tipo !== 'relaciones') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }
    if (!promediosPorRol || !promedioGlobalPorRol || !promedioDim || !deltaDim || !actual) {
      return NextResponse.json({ error: 'Faltan datos del contexto' }, { status: 400 })
    }

    const fields = await regenerarArquetipo({
      tipo, promediosPorRol, promedioGlobalPorRol, promedioDim, deltaDim, actual,
    })

    // Persistir como definitivo para este diagnóstico, si recibimos id.
    // Si las columnas todavía no existen (migración pendiente), el update
    // falla silenciosamente y devolvemos los fields para uso inmediato.
    if (diagnosticoId) {
      const col = tipo === 'brechas'
        ? 'arquetipo_brechas_override'
        : 'arquetipo_relaciones_override'
      const { error } = await supabaseAdmin
        .from('diagnosticos')
        .update({ [col]: fields })
        .eq('id', diagnosticoId)
      if (error) {
        console.warn(`No se pudo persistir el arquetipo (${col}):`, error.message)
      }
    }

    return NextResponse.json(fields)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
