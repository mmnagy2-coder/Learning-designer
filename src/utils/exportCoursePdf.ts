// PDF export of the programme specification. Same cursor-walk layout as exportPdf.ts.
import { jsPDF } from 'jspdf'
import type { Course, Module } from '../types'
import { AWARDS, FHEQ_ATTRIBUTION, notionalHours } from './fheq'

const MARGIN = 18
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2

export async function downloadCourseAsPdf(course: Course, modules: Module[]): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const rule = AWARDS[course.award]
  const outcomes = course.outcomeStatements
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

  write(course.title, 20, 'bold', 0, 1)
  write(`Programme specification · ${rule.label} · ${rule.totalCredits} credits`, 11, 'italic', 0, 4)

  sectionHeading('Programme aims')
  write(course.aims || 'None specified', 10)

  sectionHeading('Programme learning outcomes')
  if (outcomes.length > 0) {
    outcomes.forEach((o, i) =>
      write(`PO${i + 1}.  ${o.text}${o.bloomLevel ? `  (${o.bloomLevel})` : ''}`, 10, 'normal', 2, 1.5)
    )
  } else {
    write('None specified', 10)
  }

  sectionHeading('Programme structure')
  course.stages.forEach((stage) => {
    const target = rule.stages.find((s) => s.level === stage.level)?.credits ?? 0
    const stageModules = stage.moduleRefs
      .map((ref) => ({ ref, module: modules.find((m) => m.id === ref.moduleId) }))
      .filter((r): r is typeof r & { module: Module } => Boolean(r.module))
    const credits = stageModules.reduce((s, { module }) => s + (module.credits ?? 0), 0)

    ensureRoom(14)
    write(`${stage.name} (${credits}/${target} credits)`, 12, 'bold', 0, 1.5)
    if (stageModules.length === 0) {
      write('No modules assigned', 10, 'normal', 2, 1.5)
      return
    }
    stageModules.forEach(({ ref, module }) => {
      const pos = (ref.programmeOutcomeIds ?? [])
        .map((id) => outcomes.findIndex((o) => o.id === id))
        .filter((i) => i >= 0)
        .map((i) => `PO${i + 1}`)
      write(
        `•  ${module.code ? `${module.code} · ` : ''}${module.name} — ${
          module.credits ? `${module.credits} credits (${notionalHours(module.credits)}h)` : 'credits not set'
        }, ${ref.isCore ? 'core' : 'optional'}${pos.length > 0 ? `. Maps to ${pos.join(', ')}` : ''}`,
        10,
        'normal',
        2,
        1.5
      )
    })
    y += 2
  })

  if (course.notes) {
    sectionHeading('Notes')
    write(course.notes, 10)
  }

  ensureRoom(12)
  y += 4
  write(FHEQ_ATTRIBUTION, 7, 'italic')

  doc.save(`${course.title.replace(/[^a-z0-9]+/gi, '_')}_programme.pdf`)
}
