import { DATA_SOURCE } from '@/lib/config'
import { createLocalRepository, localRepository } from '@/services/localAdapter'
import { createSupabaseRepository } from '@/services/supabaseAdapter'
import type { Repository } from '@/services/types'

let instance: Repository | null = null

/**
 * Returns the active repository. Supabase when credentials exist, otherwise the
 * local adapter. `getRepository('local')` lets the admin dashboard explicitly
 * target local storage while previewing without a backend.
 */
export function getRepository(force?: 'supabase' | 'local'): Repository {
  const target = force ?? DATA_SOURCE
  if (force === 'local') return localRepository
  if (target === 'supabase') {
    if (!instance) instance = createSupabaseRepository()
    return instance
  }
  if (!instance) instance = createLocalRepository()
  return instance
}

export const repository = getRepository()
export * from '@/services/types'
