import { useCallback, useEffect, useRef, useState } from 'react'

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
  // Tracks the latest value synchronously so the setter can persist without going through
  // a React state updater. Updaters queued on a component that unmounts in the same batch
  // (e.g. "save then navigate away") are discarded by React — writing localStorage inside
  // one silently lost the save.
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    function onCustomEvent(e: Event) {
      valueRef.current = (e as CustomEvent<T>).detail
      setValue(valueRef.current)
    }
    function onStorageEvent(e: StorageEvent) {
      if (e.key === key) {
        valueRef.current = read(key, initialValue)
        setValue(valueRef.current)
      }
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
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next
      valueRef.current = resolved
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        // localStorage unavailable or quota exceeded; the in-memory value still updates.
      }
      setValue(resolved)
      // Deferred so sibling hook instances don't setState while this component is still
      // rendering (React warns about cross-component updates during render).
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(EVENT_PREFIX + key, { detail: resolved }))
      }, 0)
    },
    [key]
  )

  return [value, setStoredValue] as const
}
