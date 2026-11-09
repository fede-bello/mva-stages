// Typed Supabase client with the publishable key. RLS is the only security boundary: this key ships
// in the bundle and can only read offers and insert offers, reports and contact requests.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isConfigured = Boolean(url && key)

export const supabase: SupabaseClient<Database> | null = isConfigured
  ? createClient<Database>(url as string, key as string, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null

export class NotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured')
    this.name = 'NotConfiguredError'
  }
}

export function client(): SupabaseClient<Database> {
  if (!supabase) throw new NotConfiguredError()
  return supabase
}
