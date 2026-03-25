import { computeDocumentDiff } from '../diff/computeDocumentDiff'
import { createTempPdfPath } from '../files/createTempPdfPath'
import { extractPdfTextItems } from '../pdf/extractPdfTextItems'
import { exportDocxToPdf } from '../word/exportDocxToPdf'
import type { CompareRequest } from '../../../shared/contracts'
import { validateCompareRequest } from './validateCompareRequest'

export async function compareDocuments(request: CompareRequest) {
  const tempArtifacts: string[] = []

  try {
    const { format } = validateCompareRequest(request)

    const leftDisplayPdfPath = format === 'docx'
      ? await exportDocxToPdf(request.leftFilePath, await createTempPdfPath('left'))
      : request.leftFilePath

    const rightDisplayPdfPath = format === 'docx'
      ? await exportDocxToPdf(request.rightFilePath, await createTempPdfPath('right'))
      : request.rightFilePath

    if (format === 'docx') {
      tempArtifacts.push(leftDisplayPdfPath, rightDisplayPdfPath)
    }

    const leftItems = await extractPdfTextItems(leftDisplayPdfPath)
    const rightItems = await extractPdfTextItems(rightDisplayPdfPath)

    if (leftItems.length === 0 || rightItems.length === 0) {
      throw new Error('无法提取 PDF 文字内容，请确认该文件不是扫描版 PDF。')
    }

    const viewModel = computeDocumentDiff(leftItems, rightItems)

    return {
      format,
      leftDisplayPdfPath,
      rightDisplayPdfPath,
      tempArtifacts,
      ...viewModel
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '本地对比失败，请重试')
  }
}
