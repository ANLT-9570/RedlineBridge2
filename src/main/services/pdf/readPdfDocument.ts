import fs from 'node:fs/promises'
import path from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const standardFontDataUrl = `${path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts')}/`

export async function readPdfDocument(pdfPath: string) {
  const buffer = await fs.readFile(pdfPath)

  return getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl
  }).promise
}
