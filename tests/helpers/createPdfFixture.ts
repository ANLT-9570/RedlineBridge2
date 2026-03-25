import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { PDFDocument, StandardFonts } from 'pdf-lib'

export async function createPdfFixture(pages: string[][]): Promise<string> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  for (const lines of pages) {
    const page = pdf.addPage()
    const { height } = page.getSize()

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: 72,
        y: height - 72 - index * 24,
        size: 16,
        font
      })
    })
  }

  const pdfBytes = await pdf.save()
  const pdfPath = path.join(os.tmpdir(), `redlinebridge-test-${randomUUID()}.pdf`)

  await fs.writeFile(pdfPath, pdfBytes)

  return pdfPath
}
