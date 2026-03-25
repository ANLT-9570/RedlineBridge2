import { describe, expect, it, vi } from 'vitest'
import { compareDocuments } from '../../../../../src/main/services/compare/compareDocuments'

vi.mock('../../../../../src/main/services/word/exportDocxToPdf', () => ({
  exportDocxToPdf: vi.fn(async (inputPath: string) => inputPath.replace(/\.docx$/, '.pdf'))
}))

vi.mock('../../../../../src/main/services/pdf/extractPdfTextItems', () => ({
  extractPdfTextItems: vi.fn(async () => [
    { pageNumber: 1, itemIndex: 0, text: '付款期限为10天', x: 10, y: 700, width: 80, height: 12 }
  ])
}))

describe('compareDocuments', () => {
  it('normalizes docx inputs and returns display PDF paths', async () => {
    const result = await compareDocuments({
      leftFilePath: '/tmp/old.docx',
      rightFilePath: '/tmp/new.docx'
    })

    expect(result.leftDisplayPdfPath.endsWith('.pdf')).toBe(true)
    expect(result.rightDisplayPdfPath.endsWith('.pdf')).toBe(true)
  })
})
