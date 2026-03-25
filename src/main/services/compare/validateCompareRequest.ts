import path from 'node:path'
import type { CompareRequest, SupportedFormat } from '../../../shared/contracts'

function toFormat(filePath: string): SupportedFormat {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.pdf') {
    return 'pdf'
  }

  if (ext === '.docx') {
    return 'docx'
  }

  throw new Error('当前版本仅支持 .docx 和 PDF')
}

export function validateCompareRequest(request: CompareRequest) {
  const leftFormat = toFormat(request.leftFilePath)
  const rightFormat = toFormat(request.rightFilePath)

  if (leftFormat !== rightFormat) {
    throw new Error('当前版本仅支持同格式对比')
  }

  return { format: leftFormat }
}
