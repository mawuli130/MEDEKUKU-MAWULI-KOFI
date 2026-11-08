import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Re-run the loader. */
  reload: () => void
  /** Optimistically replace the current value. */
  setData: (updater: T | ((current: T | null) => T | null)) => void
}

/**
 * Runs an async loader and tracks loading/error state with an
 * AbortController-style "latest wins" guard so fast navigation cannot commit a
 * stale response.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options: { initial?: T | null; enabled?: boolean } = {},
): AsyncState<T> {
  const { initial = null, enabled = true } = options
  const [data, setDataState] = useState<T | null>(initial)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const requestId = useRef(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const id = ++requestId.current
    let active = true
    setLoading(true)
    setError(null)

    loaderRef
      .current()
      .then((result) => {
        if (!active || id !== requestId.current) return
        setDataState(result)
      })
      .catch((cause: unknown) => {
        if (!active || id !== requestId.current) return
        setError(cause instanceof Error ? cause.message : 'Something went wrong while loading this content.')
      })
      .finally(() => {
        if (!active || id !== requestId.current) return
        setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  const setData = useCallback((updater: T | ((current: T | null) => T | null)) => {
    setDataState((current) =>
      typeof updater === 'function' ? (updater as (value: T | null) => T | null)(current) : updater,
    )
  }, [])

  return { data, loading, error, reload, setData }
}
