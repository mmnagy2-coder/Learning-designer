import type { Design } from '../types'
import { computeAnalytics } from './calculateAnalytics'

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadDesignAsJson(design: Design) {
  const filename = `${design.name.replace(/[^a-z0-9]+/gi, '_')}.json`
  download(filename, JSON.stringify(design, null, 2), 'application/json')
}

export function designToMarkdown(design: Design): string {
  const analytics = computeAnalytics(design)
  const lines: string[] = []
  lines.push(`# ${design.name}`)
  lines.push('')
  lines.push(`**Topic:** ${design.topic}`)
  lines.push(`**Mode of delivery:** ${design.modeOfDelivery}`)
  lines.push(`**Class size:** ${design.sizeOfClass}`)
  lines.push(`**Target learning time:** ${design.learningTimeMinutes} minutes`)
  lines.push(`**Designed time:** ${analytics.totalMinutes} minutes`)
  lines.push('')
  lines.push(`## Aims`)
  lines.push(design.aims || '_None specified_')
  lines.push('')
  lines.push(`## Outcomes`)
  design.outcomes.forEach((o) => lines.push(`- ${o}`))
  lines.push('')
  lines.push(`## Description`)
  lines.push(design.description || '_None specified_')
  lines.push('')
  lines.push(`## Teaching & Learning Activities`)
  design.tlas.forEach((tla, i) => {
    lines.push('')
    lines.push(`### ${i + 1}. ${tla.title}`)
    if (tla.notes) lines.push(`_${tla.notes}_`)
    tla.learningTypes.forEach((row) => {
      lines.push(
        `- **${row.type}** — ${row.durationMinutes} min, group size ${row.groupSize}, ${
          row.teacherPresent ? 'teacher present' : 'no teacher'
        }, ${row.isOnline ? 'online' : 'face-to-face'}, ${row.isSynchronous ? 'synchronous' : 'asynchronous'}, assessment: ${row.assessmentType}${
          row.description ? ` — ${row.description}` : ''
        }`
      )
    })
    if (tla.resources.length > 0) {
      lines.push('')
      lines.push('Resources:')
      tla.resources.forEach((r) => lines.push(`- [${r.title}](${r.url})`))
    }
  })
  return lines.join('\n')
}

export function downloadDesignAsMarkdown(design: Design) {
  const filename = `${design.name.replace(/[^a-z0-9]+/gi, '_')}.md`
  download(filename, designToMarkdown(design), 'text/markdown')
}

export async function copyDesignToClipboard(design: Design): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(design, null, 2))
}
