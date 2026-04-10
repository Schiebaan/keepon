import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function getServiceRoleClient(event: H3Event) {
  const config = useRuntimeConfig()
  // @nuxtjs/supabase stores URL in config.supabase.url, fallback to config.public.supabaseUrl
  const supabaseUrl = (config as any).supabase?.url || config.public.supabaseUrl || process.env.SUPABASE_URL
  const serviceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(
    supabaseUrl,
    serviceKey,
    { auth: { persistSession: false } }
  )
}
