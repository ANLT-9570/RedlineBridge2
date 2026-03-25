import { describe, expect, it } from 'vitest'
import { computeDocumentDiff } from '../../../../../src/main/services/diff/computeDocumentDiff'
import type { TextItemRef } from '../../../../../src/shared/contracts'

const oldItems: TextItemRef[] = [
  { pageNumber: 1, itemIndex: 0, text: '付款期限为7天', x: 10, y: 700, width: 80, height: 12 }
]

const newItems: TextItemRef[] = [
  { pageNumber: 1, itemIndex: 0, text: '付款期限为10天', x: 10, y: 700, width: 80, height: 12 }
]

describe('computeDocumentDiff', () => {
  it('classifies a small text change as one modified diff', () => {
    const result = computeDocumentDiff(oldItems, newItems)

    expect(result.sidebarItems).toHaveLength(1)
    expect(result.sidebarItems[0].kind).toBe('modified')
  })
})
