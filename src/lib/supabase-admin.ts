import { createClient } from '@supabase/supabase-js'

// Cliente admin con service role. SOLO usar en servidor (API routes, server components).
// Nunca importar desde código que se envía al browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
