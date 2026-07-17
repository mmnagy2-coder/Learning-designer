// PDF export for validation panels. Loaded via dynamic import from the Export menu so jspdf
// stays out of the main bundle. Programmatic layout: a cursor walks down the page, wrapping
// text and adding pages as needed.
import { jsPDF } from 'jspdf'
import type { Design } from '../types'
import { computeAnalytics } from './calculateAnalytics'
import { FOUR_DS_ATTRIBUTION, fourDLabel } from './fourDs'
import { UDL_ATTRIBUTION, udlCheckpointLabel } from './udl'

const MODE_LABELS: Record<Design['modeOfDelivery'], string> = {
  'face-to-face': 'Face-to-face',
  blended: 'Blended',
  'wholly-online': 'Wholly online',
  'async-online': 'Async online',
}

const MARGIN = 18
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2

export async function downloadDesignAsPdf(design: Design): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const analytics = computeAnalytics(design)
  const statements = design.outcomeStatements ?? []
  let y = MARGIN

  function ensureRoom(needed: number) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  function write(text: string, size: number, style: 'normal' | 'bold' | 'italic' = 'normal', indent = 0, gapAfter = 2) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    const lines: string[] = doc.splitTextToSize(text, TEXT_WIDTH - indent)
    const lineHeight = size * 0.42
    for (const line of lines) {
      ensureRoom(lineHeight)
      doc.text(line, MARGIN + indent, y)
      y += lineHeight
    }
    y += gapAfter
  }

  function sectionHeading(text: string) {
    ensureRoom(14)
    y += 4
    write(text, 14, 'bold', 0, 3)
  }

  write(design.name, 20, 'bold', 0, 1)
  if (design.topic) write(design.topic, 11, 'italic', 0, 4)

  write(
    [
      `Mode: ${MODE_LABELS[design.modeOfDelivery]}`,
      `Class size: ${design.sizeOfClass}`,
      `Target: ${design.learningTimeMinutes} min`,
      `Designed: ${analytics.totalMinutes} min`,
      ...(design.sessionDate ? [`Date: ${design.sessionDate}`] : []),
    ].join('   ·   '),
    9,
    'normal',
    0,
    2
  )

  sectionHeading('Aims')
  write(design.aims || 'None specified', 10)

  sectionHeading('Learning outcomes')
  if (statements.length > 0) {
    statements.forEach((s, i) =>
      write(`LO${i + 1}.  ${s.text}${s.bloomLevel ? `  (${s.bloomLevel})` : ''}`, 10, 'normal', 2, 1.5)
    )
  } else if (design.outcomes.length > 0) {
    design.outcomes.forEach((o) => write(`•  ${o}`, 10, 'normal', 2, 1.5))
  } else {
    write('None specified', 10)
  }

  if (design.description) {
    sectionHeading('Description')
    write(design.description, 10)
  }

  sectionHeading('Teaching & learning activities')
  let anyFourDs = false
  let anyUdl = false
  design.tlas.forEach((tla, i) => {
    ensureRoom(20)
    write(`${i + 1}. ${tla.title}`, 12, 'bold', 0, 1.5)

    const refs = (tla.outcomeIds ?? [])
      .map((id) => statements.findIndex((s) => s.id === id))
      .filter((idx) => idx >= 0)
      .map((idx) => `LO${idx + 1}`)
    const tags: string[] = []
    if (refs.length > 0) tags.push(`Serves ${refs.join(', ')}`)
    if (tla.fourDs?.length) {
      anyFourDs = true
      tags.push(`AI literacy (4Ds): ${tla.fourDs.map(fourDLabel).join(', ')}`)
    }
    if (tla.udl?.length) {
      anyUdl = true
      tags.push(`UDL: ${tla.udl.map((id) => `${id} ${udlCheckpointLabel(id)}`).join('; ')}`)
    }
    if (tags.length > 0) write(tags.join('  ·  '), 9, 'italic', 2, 1.5)

    tla.learningTypes.forEach((row) => {
      const label = row.type.charAt(0).toUpperCase() + row.type.slice(1)
      write(
        `•  ${label} — ${row.durationMinutes} min.  Group size ${row.groupSize}, ${
          row.teacherPresent ? 'teacher present' : 'no teacher'
        }, ${row.isOnline ? 'online' : 'face-to-face'}, ${row.isSynchronous ? 'synchronous' : 'asynchronous'}${
          row.assessmentType !== 'none' ? `, ${row.assessmentType} assessment` : ''
        }.${row.description ? ` ${row.description}` : ''}`,
        10,
        'normal',
        2,
        1.5
      )
    })

    if (tla.notes) write(`Notes: ${tla.notes}`, 9, 'italic', 2, 1.5)
    if (tla.resources.length > 0) {
      write('Resources:', 10, 'bold', 2, 1)
      tla.resources.forEach((r) => write(`•  ${r.title} — ${r.url}`, 9, 'normal', 4, 1))
    }
    y += 2
  })

  if (anyFourDs) {
    ensureRoom(12)
    y += 4
    write(FOUR_DS_ATTRIBUTION, 7, 'italic')
  }
  if (anyUdl) {
    ensureRoom(12)
    if (!anyFourDs) y += 4
    write(UDL_ATTRIBUTION, 7, 'italic')
  }

  doc.save(`${design.name.replace(/[^a-z0-9]+/gi, '_')}.pdf`)
}
