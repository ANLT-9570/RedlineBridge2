import { diffWordsWithSpace } from 'diff'
import type { Change } from 'diff'
import type { DiffKind, TextItemRef } from '../../../shared/contracts'
import { buildCompareViewModel } from './buildCompareViewModel'
import { groupTextItemsIntoBlocks } from './groupTextItemsIntoBlocks'

interface RawDiff {
  kind: DiffKind
  leftBlock: ReturnType<typeof groupTextItemsIntoBlocks>[number] | null
  rightBlock: ReturnType<typeof groupTextItemsIntoBlocks>[number] | null
  tokens: Change[]
}

export function computeDocumentDiff(leftItems: TextItemRef[], rightItems: TextItemRef[]) {
  const leftBlocks = groupTextItemsIntoBlocks(leftItems)
  const rightBlocks = groupTextItemsIntoBlocks(rightItems)
  const rawDiffs: RawDiff[] = []
  const maxLength = Math.max(leftBlocks.length, rightBlocks.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftBlock = leftBlocks[index] ?? null
    const rightBlock = rightBlocks[index] ?? null

    if (leftBlock && rightBlock) {
      if (leftBlock.text === rightBlock.text) {
        continue
      }

      rawDiffs.push({
        kind: 'modified',
        leftBlock,
        rightBlock,
        tokens: diffWordsWithSpace(leftBlock.text, rightBlock.text)
      })
      continue
    }

    if (leftBlock) {
      rawDiffs.push({
        kind: 'removed',
        leftBlock,
        rightBlock: null,
        tokens: []
      })
      continue
    }

    if (rightBlock) {
      rawDiffs.push({
        kind: 'added',
        leftBlock: null,
        rightBlock,
        tokens: []
      })
    }
  }

  return buildCompareViewModel(rawDiffs)
}
