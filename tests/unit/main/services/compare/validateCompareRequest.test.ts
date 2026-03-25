import { describe, expect, it } from 'vitest'
import { validateCompareRequest } from '../../../../../src/main/services/compare/validateCompareRequest'

describe('validateCompareRequest', () => {
  it('rejects mixed formats', () => {
    expect(() =>
      validateCompareRequest({
        leftFilePath: '/tmp/old.docx',
        rightFilePath: '/tmp/new.pdf'
      })
    ).toThrow('当前版本仅支持同格式对比')
  })
})
