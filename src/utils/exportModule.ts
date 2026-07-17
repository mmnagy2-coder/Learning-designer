import type { Module } from '../types'

export function downloadModuleAsJson(module: Module) {
  const blob = new Blob([JSON.stringify(module, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${module.name.replace(/[^a-z0-9]+/gi, '_')}_module.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
