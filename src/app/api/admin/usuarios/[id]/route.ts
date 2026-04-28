import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

// PATCH /api/admin/usuarios/:id — actualiza email o contraseña
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: { email?: string; password?: string } = {}
    if (typeof body.email === 'string' && body.email.trim()) updates.email = body.email.trim()
    if (typeof body.password === 'string' && body.password) {
      if (body.password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      updates.password = body.password
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/admin/usuarios/:id — elimina usuario
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
