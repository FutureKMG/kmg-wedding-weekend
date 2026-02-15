import { createClient } from '@supabase/supabase-js'
import { getRequiredEnv } from './env.js'

let client

export function getSupabaseAdminClient() {
  if (!client) {
    client = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return client
}
