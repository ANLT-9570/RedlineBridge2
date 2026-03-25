import type { TextItemRef } from '../../../shared/contracts'

export interface DiffBlock {
  pageNumber: number
  text: string
  itemIndexes: number[]
  anchor: {
    x: number
    y: number
  }
}

export function groupTextItemsIntoBlocks(items: TextItemRef[]): DiffBlock[] {
  const sorted = [...items].sort(
    (a, b) => a.pageNumber - b.pageNumber || b.y - a.y || a.x - b.x
  )

  return sorted.map((item) => ({
    pageNumber: item.pageNumber,
    text: item.text.trim(),
    itemIndexes: [item.itemIndex],
    anchor: {
      x: item.x,
      y: item.y
    }
  }))
}
