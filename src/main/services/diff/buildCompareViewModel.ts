import type { Change } from 'diff'
import type { DiffKind, DiffSidebarItem, PageAnnotation } from '../../../shared/contracts'
import type { DiffBlock } from './groupTextItemsIntoBlocks'

interface RawDiff {
  kind: DiffKind
  leftBlock: DiffBlock | null
  rightBlock: DiffBlock | null
  tokens: Change[]
}

function buildSummary(diff: RawDiff) {
  if (diff.leftBlock && diff.rightBlock) {
    return `${diff.leftBlock.text} → ${diff.rightBlock.text}`
  }

  if (diff.leftBlock) {
    return diff.leftBlock.text
  }

  return diff.rightBlock?.text ?? ''
}

function addAnnotation(
  target: Record<number, PageAnnotation[]>,
  pageNumber: number,
  annotation: PageAnnotation
) {
  target[pageNumber] ??= []
  target[pageNumber].push(annotation)
}

function buildPlaceholderLabel(kind: DiffKind) {
  if (kind === 'removed') {
    return '已删除'
  }

  if (kind === 'added') {
    return '新增内容'
  }

  return '内容变更'
}

export function buildCompareViewModel(rawDiffs: RawDiff[]) {
  const sidebarItems: DiffSidebarItem[] = []
  const leftAnnotations: Record<number, PageAnnotation[]> = {}
  const rightAnnotations: Record<number, PageAnnotation[]> = {}

  rawDiffs.forEach((diff, index) => {
    const id = `diff-${index + 1}`

    sidebarItems.push({
      id,
      kind: diff.kind,
      summary: buildSummary(diff),
      leftPageNumber: diff.leftBlock?.pageNumber ?? null,
      rightPageNumber: diff.rightBlock?.pageNumber ?? null
    })

    if (diff.leftBlock) {
      addAnnotation(leftAnnotations, diff.leftBlock.pageNumber, {
        diffId: id,
        kind: diff.kind,
        pageNumber: diff.leftBlock.pageNumber,
        itemIndexes: diff.leftBlock.itemIndexes
      })
    }

    if (diff.rightBlock) {
      addAnnotation(rightAnnotations, diff.rightBlock.pageNumber, {
        diffId: id,
        kind: diff.kind,
        pageNumber: diff.rightBlock.pageNumber,
        itemIndexes: diff.rightBlock.itemIndexes
      })
    }

    if (diff.kind === 'removed' && diff.leftBlock) {
      addAnnotation(rightAnnotations, diff.leftBlock.pageNumber, {
        diffId: id,
        kind: diff.kind,
        pageNumber: diff.leftBlock.pageNumber,
        itemIndexes: [],
        placeholder: {
          x: diff.leftBlock.anchor.x,
          y: diff.leftBlock.anchor.y,
          label: buildPlaceholderLabel(diff.kind)
        }
      })
    }

    if (diff.kind === 'added' && diff.rightBlock) {
      addAnnotation(leftAnnotations, diff.rightBlock.pageNumber, {
        diffId: id,
        kind: diff.kind,
        pageNumber: diff.rightBlock.pageNumber,
        itemIndexes: [],
        placeholder: {
          x: diff.rightBlock.anchor.x,
          y: diff.rightBlock.anchor.y,
          label: buildPlaceholderLabel(diff.kind)
        }
      })
    }
  })

  return {
    sidebarItems,
    leftAnnotations,
    rightAnnotations
  }
}
