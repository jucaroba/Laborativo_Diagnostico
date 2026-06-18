import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente de servidor ligado a las cookies de la request. Úsalo en server
// components / route handlers para leer la sesión del usuario admin.
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // En server components puede no permitirse escribir cookies; el
          // refresh de sesión lo maneja el middleware, así que ignoramos el error.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )
}
