// Word export of the module descriptor, for validation panels. Loaded via dynamic import
// from the Module Designer's Export menu so the docx library stays out of the main bundle.
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
import type { Design, Module } from '../types'
import { computeModuleAnalytics } from './moduleAnalytics'
import { FHEQ_ATTRIBUTION, FHEQ_LEVELS, notionalHours } from './fheq'

function metaRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [new Paragraph(value)],
      }),
    ],
  })
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } })
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 } })
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] })
}

export async function downloadModuleAsDocx(module: Module, linkedDesigns: Design[]): Promise<void> {
  const analytics = computeModuleAnalytics(module, linkedDesigns)
  const statements = module.outcomeStatements ?? []
  const assessments = module.assessments ?? []
  const weeks = module.weeks ?? []
  const descriptor = module.level ? FHEQ_LEVELS[module.level] : undefined
  const children: (Paragraph | Table)[] = []

  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(module.name)] }))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Module descriptor', italics: true })],
      spacing: { after: 240 },
    })
  )

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ...(module.code ? [metaRow('Module code', module.code)] : []),
        ...(module.credits
          ? [
              metaRow('Credits', `${module.credits} (${notionalHours(module.credits)} notional learning hours)`),
            ]
          : []),
        ...(module.level ? [metaRow('FHEQ level', `Level ${module.level} — ${descriptor?.award ?? ''}`)] : []),
        metaRow(
          'Planned sessions',
          `${analytics.linkedDesignCount} designed (${(analytics.designedMinutes / 60).toFixed(1)} hours of designed learning time)`
        ),
      ],
    })
  )

  children.push(heading('Aims', HeadingLevel.HEADING_1))
  children.push(new Paragraph(module.aims || 'None specified'))

  children.push(heading('Learning outcomes', HeadingLevel.HEADING_1))
  if (statements.length > 0) {
    statements.forEach((s, i) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `LO${i + 1}. `, bold: true }),
            new TextRun(s.text),
            ...(s.bloomLevel ? [new TextRun({ text: ` (${s.bloomLevel})`, italics: true })] : []),
          ],
        })
      )
    })
  } else {
    children.push(new Paragraph('None specified'))
  }

  if (assessments.length > 0) {
    children.push(heading('Assessment strategy', HeadingLevel.HEADING_1))
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [cell('Component', true), cell('Method', true), cell('Type', true), cell('Weighting', true), cell('Week', true), cell('Assesses', true)],
          }),
          ...assessments.map(
            (a) =>
              new TableRow({
                children: [
                  cell(a.title),
                  cell(a.method || '—'),
                  cell(a.type),
                  cell(a.type === 'summative' ? `${a.weighting}%` : '—'),
                  cell(a.weekDue ? `Week ${a.weekDue}` : '—'),
                  cell(
                    a.outcomeIds
                      .map((id) => statements.findIndex((s) => s.id === id))
                      .filter((i) => i >= 0)
                      .map((i) => `LO${i + 1}`)
                      .join(', ') || '—'
                  ),
                ],
              })
          ),
        ],
      })
    )
  }

  if (module.indicativeContent) {
    children.push(heading('Indicative content', HeadingLevel.HEADING_1))
    children.push(new Paragraph(module.indicativeContent))
  }

  if (weeks.length > 0) {
    children.push(heading('Delivery plan', HeadingLevel.HEADING_1))
    weeks.forEach((w) => {
      children.push(heading(`Week ${w.number}${w.topic ? `: ${w.topic}` : ''}`, HeadingLevel.HEADING_2))
      const sessions = w.designIds
        .map((id) => linkedDesigns.find((d) => d.id === id))
        .filter((d): d is Design => Boolean(d))
      sessions.forEach((d) => children.push(bullet(`Session: ${d.name}${d.sessionDate ? ` (${d.sessionDate})` : ''}`)))
      if (w.notes) children.push(new Paragraph({ children: [new TextRun({ text: w.notes, italics: true })] }))
    })
  }

  if (module.readingList?.length) {
    children.push(heading('Indicative reading and resources', HeadingLevel.HEADING_1))
    module.readingList.forEach((r) => children.push(bullet(r.url ? `${r.title} — ${r.url}` : r.title)))
  }

  if (module.level) {
    children.push(
      new Paragraph({
        spacing: { before: 360 },
        children: [new TextRun({ text: FHEQ_ATTRIBUTION, italics: true, size: 16 })],
      })
    )
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${module.name.replace(/[^a-z0-9]+/gi, '_')}_module.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
