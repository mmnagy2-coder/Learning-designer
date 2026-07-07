// Word export for module leaders and validation panels. Loaded via dynamic import from the
// Export menu so the docx library stays out of the main bundle.
import {
  AlignmentType,
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
import type { Design } from '../types'
import { computeAnalytics } from './calculateAnalytics'
import { FOUR_DS_ATTRIBUTION, fourDLabel } from './fourDs'

const MODE_LABELS: Record<Design['modeOfDelivery'], string> = {
  'face-to-face': 'Face-to-face',
  blended: 'Blended',
  'wholly-online': 'Wholly online',
  'async-online': 'Async online',
}

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

export async function downloadDesignAsDocx(design: Design): Promise<void> {
  const analytics = computeAnalytics(design)
  const statements = design.outcomeStatements ?? []
  const children: (Paragraph | Table)[] = []

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(design.name)],
    })
  )
  if (design.topic) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: design.topic, italics: true })],
        spacing: { after: 240 },
      })
    )
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        metaRow('Mode of delivery', MODE_LABELS[design.modeOfDelivery]),
        metaRow('Class size', String(design.sizeOfClass)),
        metaRow('Target learning time', `${design.learningTimeMinutes} minutes`),
        metaRow('Designed time', `${analytics.totalMinutes} minutes`),
        ...(design.sessionDate ? [metaRow('Session date', design.sessionDate)] : []),
      ],
    })
  )

  children.push(heading('Aims', HeadingLevel.HEADING_1))
  children.push(new Paragraph(design.aims || 'None specified'))

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
  } else if (design.outcomes.length > 0) {
    design.outcomes.forEach((o) => children.push(bullet(o)))
  } else {
    children.push(new Paragraph('None specified'))
  }

  if (design.description) {
    children.push(heading('Description', HeadingLevel.HEADING_1))
    children.push(new Paragraph(design.description))
  }

  children.push(heading('Teaching & learning activities', HeadingLevel.HEADING_1))
  let anyFourDs = false
  design.tlas.forEach((tla, i) => {
    children.push(heading(`${i + 1}. ${tla.title}`, HeadingLevel.HEADING_2))

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
    if (tags.length > 0) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: tags.join(' · '), italics: true })] })
      )
    }

    tla.learningTypes.forEach((row) => {
      const label = row.type.charAt(0).toUpperCase() + row.type.slice(1)
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `${label} — ${row.durationMinutes} min. `, bold: true }),
            new TextRun(
              `Group size ${row.groupSize}, ${row.teacherPresent ? 'teacher present' : 'no teacher'}, ${
                row.isOnline ? 'online' : 'face-to-face'
              }, ${row.isSynchronous ? 'synchronous' : 'asynchronous'}${
                row.assessmentType !== 'none' ? `, ${row.assessmentType} assessment` : ''
              }.${row.description ? ` ${row.description}` : ''}`
            ),
          ],
        })
      )
    })

    if (tla.notes) {
      children.push(new Paragraph({ children: [new TextRun({ text: `Notes: ${tla.notes}`, italics: true })] }))
    }
    if (tla.resources.length > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Resources:', bold: true })] }))
      tla.resources.forEach((r) => children.push(bullet(`${r.title} — ${r.url}`)))
    }
  })

  if (anyFourDs) {
    children.push(
      new Paragraph({
        spacing: { before: 360 },
        children: [new TextRun({ text: FOUR_DS_ATTRIBUTION, italics: true, size: 16 })],
      })
    )
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${design.name.replace(/[^a-z0-9]+/gi, '_')}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
