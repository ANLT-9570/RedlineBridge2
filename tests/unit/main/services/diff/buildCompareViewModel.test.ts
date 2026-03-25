import { describe, expect, it } from 'vitest'
import { buildCompareViewModel } from '../../../../../src/main/services/diff/buildCompareViewModel'

describe('buildCompareViewModel', () => {
  it('adds a placeholder annotation on the opposite side for removed diffs', () => {
    const result = buildCompareViewModel([
      {
        kind: 'removed',
        leftBlock: {
          pageNumber: 2,
          text: '旧条款',
          itemIndexes: [3],
          anchor: { x: 120, y: 240 }
        },
        rightBlock: null,
        tokens: []
      }
    ])

    expect(result.leftAnnotations[2]).toEqual([
      {
        diffId: 'diff-1',
        kind: 'removed',
        pageNumber: 2,
        itemIndexes: [3]
      }
    ])
    expect(result.rightAnnotations[2]).toEqual([
      {
        diffId: 'diff-1',
        kind: 'removed',
        pageNumber: 2,
        itemIndexes: [],
        placeholder: {
          x: 120,
          y: 240,
          label: '已删除'
        }
      }
    ])
  })

  it('adds a placeholder annotation on the opposite side for added diffs', () => {
    const result = buildCompareViewModel([
      {
        kind: 'added',
        leftBlock: null,
        rightBlock: {
          pageNumber: 4,
          text: '新条款',
          itemIndexes: [8],
          anchor: { x: 64, y: 512 }
        },
        tokens: []
      }
    ])

    expect(result.leftAnnotations[4]).toEqual([
      {
        diffId: 'diff-1',
        kind: 'added',
        pageNumber: 4,
        itemIndexes: [],
        placeholder: {
          x: 64,
          y: 512,
          label: '新增内容'
        }
      }
    ])
    expect(result.rightAnnotations[4]).toEqual([
      {
        diffId: 'diff-1',
        kind: 'added',
        pageNumber: 4,
        itemIndexes: [8]
      }
    ])
  })
})
