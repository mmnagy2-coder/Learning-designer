// Word export of the programme specification. Loaded via dynamic import from the Course
// Designer's Export menu so the docx library stays out of the main bundle.
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { Course, Module } from '../types'
import { AWARDS, FHEQ_ATTRIBUTION, notionalHours } from './fheq'

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } })
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] })
}

export async function downloadCourseAsDocx(course: Course, modules: Module[]): Promise<void> {
  const rule = AWARDS[course.award]
  const outcomes = course.outcomeStatements
  const children: (Paragraph | Table)[] = []

  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(course.title)] }))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Programme specification · ${rule.label} · ${rule.totalCredits} credits`, italics: true })],
      spacing: { after: 240 },
    })
  )

  children.push(heading('Programme aims', HeadingLevel.HEADING_1))
  children.push(new Paragraph(course.aims || 'None specified'))

  children.push(heading('Programme learning outcomes', HeadingLevel.HEADING_1))
  if (outcomes.length > 0) {
    outcomes.forEach((o, i) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `PO${i + 1}. `, bold: true }),
            new TextRun(o.text),
            ...(o.bloomLevel ? [new TextRun({ text: ` (${o.bloomLevel})`, italics: true })] : []),
          ],
        })
      )
    })
  } else {
    children.push(new Paragraph('None specified'))
  }

  children.push(heading('Programme structure', HeadingLevel.HEADING_1))
  course.stages.forEach((stage) => {
    const target = rule.stages.find((s) => s.level === stage.level)?.credits ?? 0
    const stageModules = stage.moduleRefs
      .map((ref) => ({ ref, module: modules.find((m) => m.id === ref.moduleId) }))
      .filter((r): r is typeof r & { module: Module } => Boolean(r.module))
    const credits = stageModules.reduce((s, { module }) => s + (module.credits ?? 0), 0)

    children.push(heading(`${stage.name} (${credits}/${target} credits)`, HeadingLevel.HEADING_2))
    if (stageModules.length === 0) {
      children.push(new Paragraph('No modules assigned'))
      return
    }
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [cell('Code', true), cell('Module', true), cell('Credits', true), cell('Notional hours', true), cell('Core/Optional', true)],
          }),
          ...stageModules.map(
            ({ ref, module }) =>
              new TableRow({
                children: [
                  cell(module.code ?? '—'),
                  cell(module.name),
                  cell(module.credits ? String(module.credits) : '—'),
                  cell(module.credits ? String(notionalHours(module.credits)) : '—'),
                  cell(ref.isCore ? 'Core' : 'Optional'),
                ],
              })
          ),
        ],
      })
    )
  })

  if (outcomes.length > 0) {
    const rows = course.stages.flatMap((stage) =>
      stage.moduleRefs
        .map((ref) => ({ ref, module: modules.find((m) => m.id === ref.moduleId) }))
        .filter((r): r is typeof r & { module: Module } => Boolean(r.module))
    )
    if (rows.length > 0) {
      children.push(heading('Curriculum map', HeadingLevel.HEADING_1))
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [cell('Module', true), ...outcomes.map((_, i) => cell(`PO${i + 1}`, true))],
            }),
            ...rows.map(
              ({ ref, module }) =>
                new TableRow({
                  children: [
                    cell(module.code ? `${module.code} · ${module.name}` : module.name),
                    ...outcomes.map((o) => cell((ref.programmeOutcomeIds ?? []).includes(o.id) ? '✓' : '')),
                  ],
                })
            ),
          ],
        })
      )
    }
  }

  if (course.notes) {
    children.push(heading('Notes', HeadingLevel.HEADING_1))
    children.push(new Paragraph(course.notes))
  }

  children.push(
    new Paragraph({
      spacing: { before: 360 },
      children: [new TextRun({ text: FHEQ_ATTRIBUTION, italics: true, size: 16 })],
    })
  )

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${course.title.replace(/[^a-z0-9]+/gi, '_')}_programme.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
