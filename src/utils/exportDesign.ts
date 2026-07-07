import type { Design } from '../types'
import { computeAnalytics } from './calculateAnalytics'
import { FOUR_DS_ATTRIBUTION, fourDLabel } from './fourDs'

/** "LO1, LO3" style reference for a TLA's aligned outcomes, or null when unaligned. */
function outcomeRefs(design: Design, outcomeIds: string[] | undefined): string | null {
  const statements = design.outcomeStatements ?? []
  if (!outcomeIds?.length || statements.length === 0) return null
  const refs = outcomeIds
    .map((id) => statements.findIndex((s) => s.id === id))
    .filter((i) => i >= 0)
    .map((i) => `LO${i + 1}`)
  return refs.length > 0 ? refs.join(', ') : null
}

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
  const statements = design.outcomeStatements ?? []
  lines.push(`## Learning outcomes`)
  if (statements.length > 0) {
    statements.forEach((s, i) =>
      lines.push(`- **LO${i + 1}.** ${s.text}${s.bloomLevel ? ` _(${s.bloomLevel})_` : ''}`)
    )
  } else if (design.outcomes.length > 0) {
    design.outcomes.forEach((o) => lines.push(`- ${o}`))
  } else {
    lines.push('_None specified_')
  }
  lines.push('')
  lines.push(`## Description`)
  lines.push(design.description || '_None specified_')
  lines.push('')
  lines.push(`## Teaching & Learning Activities`)
  let anyFourDs = false
  design.tlas.forEach((tla, i) => {
    lines.push('')
    lines.push(`### ${i + 1}. ${tla.title}`)
    const refs = outcomeRefs(design, tla.outcomeIds)
    if (refs) lines.push(`_Serves ${refs}_`)
    if (tla.fourDs?.length) {
      anyFourDs = true
      lines.push(`_AI literacy (4Ds): ${tla.fourDs.map(fourDLabel).join(', ')}_`)
    }
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
  if (anyFourDs) {
    lines.push('')
    lines.push(`---`)
    lines.push(`_${FOUR_DS_ATTRIBUTION}_`)
  }
  return lines.join('\n')
}

export function downloadDesignAsMarkdown(design: Design) {
  const filename = `${design.name.replace(/[^a-z0-9]+/gi, '_')}.md`
  download(filename, designToMarkdown(design), 'text/markdown')
}

export async function copyDesignToClipboard(design: Design): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(design, null, 2))
}
