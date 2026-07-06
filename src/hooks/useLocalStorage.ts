import { useCallback, useEffect, useState } from 'react'

// Custom event name prefix so multiple hook instances watching the same key (e.g. the
// Designer, Browser, and AI Settings panel all reading 'ld_designs') stay in sync within a tab.
const EVENT_PREFIX = 'ld-local-storage:'

function read<T>(key: string, initialValue: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : initialValue
  } catch {
    return initialValue
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => read(key, initialValue))

  useEffect(() => {
    function onCustomEvent(e: Event) {
      setValue((e as CustomEvent<T>).detail)
    }
    function onStorageEvent(e: StorageEvent) {
      if (e.key === key) setValue(read(key, initialValue))
    }
    window.addEventListener(EVENT_PREFIX + key, onCustomEvent)
    window.addEventListener('storage', onStorageEvent)
    return () => {
      window.removeEventListener(EVENT_PREFIX + key, onCustomEvent)
      window.removeEventListener('storage', onStorageEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // localStorage unavailable or quota exceeded; the in-memory value still updates.
        }
        // Deferred so sibling hook instances don't setState while this component is still
        // rendering (React warns about cross-component updates during render).
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent(EVENT_PREFIX + key, { detail: resolved }))
        }, 0)
        return resolved
      })
    },
    [key]
  )

  return [value, setStoredValue] as const
}
