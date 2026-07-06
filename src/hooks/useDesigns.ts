import { useCallback, useEffect, useState } from 'react'
import type { Design } from '../types'
import { seedDesigns } from '../utils/seedData'
import { useLocalStorage } from './useLocalStorage'

export function useDesigns() {
  const [designs, setDesigns] = useLocalStorage<Design[]>('ld_designs', [])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const initialized = window.localStorage.getItem('ld_initialized')
    if (!initialized) {
      setDesigns(seedDesigns)
      window.localStorage.setItem('ld_initialized', 'true')
    }
    setLoaded(true)
    // Only run once on mount — seeding is a one-time migration, not a reactive effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addDesign = useCallback(
    (design: Design) => {
      setDesigns((prev) => [...prev, design])
    },
    [setDesigns]
  )

  const saveDesign = useCallback(
    (design: Design) => {
      setDesigns((prev) => {
        const exists = prev.some((d) => d.id === design.id)
        if (exists) {
          return prev.map((d) => (d.id === design.id ? design : d))
        }
        return [...prev, design]
      })
    },
    [setDesigns]
  )

  const deleteDesign = useCallback(
    (id: string) => {
      setDesigns((prev) => prev.filter((d) => d.id !== id))
    },
    [setDesigns]
  )

  const duplicateDesign = useCallback(
    (id: string): Design | null => {
      const source = designs.find((d) => d.id === id)
      if (!source) return null
      const copy: Design = {
        ...source,
        id: crypto.randomUUID(),
        name: `${source.name} (copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        derivedFrom: source.id,
      }
      setDesigns((prev) => [...prev, copy])
      return copy
    },
    [designs, setDesigns]
  )

  const getDesign = useCallback((id: string) => designs.find((d) => d.id === id), [designs])

  const resetToSampleData = useCallback(() => {
    setDesigns(seedDesigns)
  }, [setDesigns])

  return { designs, loaded, addDesign, saveDesign, deleteDesign, duplicateDesign, getDesign, resetToSampleData }
}
