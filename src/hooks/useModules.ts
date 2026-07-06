import { useCallback } from 'react'
import type { Module } from '../types'
import { useLocalStorage } from './useLocalStorage'

export function useModules() {
  const [modules, setModules] = useLocalStorage<Module[]>('ld_modules', [])

  const createModule = useCallback(
    (name: string): Module => {
      const now = new Date().toISOString()
      const module: Module = { id: crypto.randomUUID(), name: name.trim(), createdAt: now, updatedAt: now }
      setModules((prev) => [...prev, module])
      return module
    },
    [setModules]
  )

  const renameModule = useCallback(
    (id: string, name: string) => {
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, name: name.trim(), updatedAt: new Date().toISOString() } : m))
      )
    },
    [setModules]
  )

  const deleteModule = useCallback(
    (id: string) => {
      setModules((prev) => prev.filter((m) => m.id !== id))
    },
    [setModules]
  )

  const getModule = useCallback((id: string) => modules.find((m) => m.id === id), [modules])

  return { modules, createModule, renameModule, deleteModule, getModule }
}
