import { describe, expect, it } from 'vitest'
import { createPdfFixture } from '../../../../helpers/createPdfFixture'
import { extractPdfTextItems } from '../../../../../src/main/services/pdf/extractPdfTextItems'

describe('extractPdfTextItems', () => {
  it('returns page numbers and ordered item indexes', async () => {
    const pdfPath = await createPdfFixture([
      ['First paragraph'],
      ['Second paragraph']
    ])

    const items = await extractPdfTextItems(pdfPath)

    expect(items[0]).toMatchObject({ pageNumber: 1, itemIndex: 0 })
    expect(items.map((item) => item.text).join('')).toContain('First paragraph')
  })
})
