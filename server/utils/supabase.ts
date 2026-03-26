import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function getServiceRoleClient(event: H3Event) {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
    { auth: { persistSession: false } }
  )
}
