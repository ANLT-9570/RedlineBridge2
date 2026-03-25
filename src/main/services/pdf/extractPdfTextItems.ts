import type { TextItemRef } from '../../../shared/contracts'
import { readPdfDocument } from './readPdfDocument'

export async function extractPdfTextItems(pdfPath: string): Promise<TextItemRef[]> {
  const document = await readPdfDocument(pdfPath)
  const items: TextItemRef[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()

    content.items.forEach((item, itemIndex) => {
      if (!('str' in item)) {
        return
      }

      items.push({
        pageNumber,
        itemIndex,
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height
      })
    })
  }

  return items
}
