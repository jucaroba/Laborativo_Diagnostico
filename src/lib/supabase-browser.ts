import { createBrowserClient } from '@supabase/ssr'

// Cliente para componentes cliente que necesitan la SESIÓN de auth (login/logout).
// Guarda la sesión en cookies (no localStorage) para que el middleware y los
// server components puedan leerla. Para queries de datos públicas se sigue usando
// el cliente anónimo simple de '@/lib/supabase'.
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
