import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DATA_SOURCE } from '@/lib/config'
import { defaultProfile, defaultSettings } from '@/lib/defaults'
import { getRepository } from '@/services'
import type { Profile, SiteSettingsMap, SocialLink } from '@/types'

interface SiteDataValue {
  profile: Profile
  settings: SiteSettingsMap
  socialLinks: SocialLink[]
  loading: boolean
  error: string | null
  dataSource: 'supabase' | 'local'
  refresh: () => void
}

const SiteDataContext = createContext<SiteDataValue | null>(null)

/**
 * Loads the singleton profile, settings and social links once per session and
 * shares them with every page. Content updates in the dashboard call refresh()
 * so the public site reflects them without a redeploy.
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [settings, setSettings] = useState<SiteSettingsMap>(defaultSettings)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    const repository = getRepository()
    setLoading(true)
    setError(null)

    Promise.allSettled([
      repository.profile.get(),
      repository.settings.getAll(),
      repository.socialLinks.list(),
    ]).then((results) => {
      if (!active) return
      const [profileResult, settingsResult, socialResult] = results

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value)
      } else {
        setError(
          profileResult.reason instanceof Error
            ? profileResult.reason.message
            : 'The profile could not be loaded.',
        )
      }

      if (settingsResult.status === 'fulfilled') {
        setSettings({ ...defaultSettings, ...settingsResult.value })
      }
      if (socialResult.status === 'fulfilled') {
        setSocialLinks(socialResult.value)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [nonce])

  const refresh = useCallback(() => setNonce((value) => value + 1), [])

  const value = useMemo<SiteDataValue>(
    () => ({ profile, settings, socialLinks, loading, error, dataSource: DATA_SOURCE, refresh }),
    [profile, settings, socialLinks, loading, error, refresh],
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData(): SiteDataValue {
  const context = useContext(SiteDataContext)
  if (!context) throw new Error('useSiteData must be used inside <SiteDataProvider>')
  return context
}

/** Convenience: the profile plus derived display helpers. */
export function useProfile() {
  const { profile } = useSiteData()
  return profile
}
