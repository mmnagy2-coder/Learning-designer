// PDF export of the module descriptor. Same cursor-walk layout as exportPdf.ts; loaded via
// dynamic import so jspdf stays out of the main bundle.
import { jsPDF } from 'jspdf'
import type { Design, Module } from '../types'
import { computeModuleAnalytics } from './moduleAnalytics'
import { FHEQ_ATTRIBUTION, FHEQ_LEVELS, notionalHours } from './fheq'

const MARGIN = 18
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2

export async function downloadModuleAsPdf(module: Module, linkedDesigns: Design[]): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const analytics = computeModuleAnalytics(module, linkedDesigns)
  const statements = module.outcomeStatements ?? []
  const assessments = module.assessments ?? []
  const weeks = module.weeks ?? []
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

  write(module.name, 20, 'bold', 0, 1)
  write('Module descriptor', 11, 'italic', 0, 4)

  write(
    [
      ...(module.code ? [`Code: ${module.code}`] : []),
      ...(module.credits ? [`Credits: ${module.credits} (${notionalHours(module.credits)} notional hours)`] : []),
      ...(module.level ? [`FHEQ level ${module.level} — ${FHEQ_LEVELS[module.level].award}`] : []),
      `Sessions designed: ${analytics.linkedDesignCount} (${(analytics.designedMinutes / 60).toFixed(1)}h)`,
    ].join('   ·   '),
    9,
    'normal',
    0,
    2
  )

  sectionHeading('Aims')
  write(module.aims || 'None specified', 10)

  sectionHeading('Learning outcomes')
  if (statements.length > 0) {
    statements.forEach((s, i) =>
      write(`LO${i + 1}.  ${s.text}${s.bloomLevel ? `  (${s.bloomLevel})` : ''}`, 10, 'normal', 2, 1.5)
    )
  } else {
    write('None specified', 10)
  }

  if (assessments.length > 0) {
    sectionHeading('Assessment strategy')
    assessments.forEach((a) => {
      const refs = a.outcomeIds
        .map((id) => statements.findIndex((s) => s.id === id))
        .filter((i) => i >= 0)
        .map((i) => `LO${i + 1}`)
      write(
        `•  ${a.title} — ${a.method || 'method TBC'}, ${a.type}${
          a.type === 'summative' ? `, ${a.weighting}%` : ''
        }${a.weekDue ? `, due week ${a.weekDue}` : ''}${refs.length > 0 ? `. Assesses ${refs.join(', ')}` : ''}`,
        10,
        'normal',
        2,
        1.5
      )
    })
  }

  if (module.indicativeContent) {
    sectionHeading('Indicative content')
    write(module.indicativeContent, 10)
  }

  if (weeks.length > 0) {
    sectionHeading('Delivery plan')
    weeks.forEach((w) => {
      ensureRoom(14)
      write(`Week ${w.number}${w.topic ? `: ${w.topic}` : ''}`, 11, 'bold', 0, 1)
      w.designIds
        .map((id) => linkedDesigns.find((d) => d.id === id))
        .filter((d): d is Design => Boolean(d))
        .forEach((d) => write(`•  Session: ${d.name}${d.sessionDate ? ` (${d.sessionDate})` : ''}`, 10, 'normal', 2, 1))
      if (w.notes) write(w.notes, 9, 'italic', 2, 1.5)
    })
  }

  if (module.readingList?.length) {
    sectionHeading('Indicative reading and resources')
    module.readingList.forEach((r) => write(`•  ${r.url ? `${r.title} — ${r.url}` : r.title}`, 9, 'normal', 2, 1))
  }

  if (module.level) {
    ensureRoom(12)
    y += 4
    write(FHEQ_ATTRIBUTION, 7, 'italic')
  }

  doc.save(`${module.name.replace(/[^a-z0-9]+/gi, '_')}_module.pdf`)
}
