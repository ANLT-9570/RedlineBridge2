import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-pdf', () => ({
  Document: ({ children }: { children: unknown }) => <div>{children}</div>,
  Page: ({ pageNumber }: { pageNumber: number }) => <div>Page {pageNumber}</div>
}))

import CompareScreen from '../../../src/renderer/src/screens/CompareScreen'

const api = {
  pickFile: vi.fn(),
  compareDocuments: vi.fn(),
  cleanupTempArtifacts: vi.fn(),
  readPdfFile: vi.fn()
}

Object.assign(window, { redlineBridge: api })

const result = {
  format: 'pdf',
  leftDisplayPdfPath: '/tmp/old.pdf',
  rightDisplayPdfPath: '/tmp/new.pdf',
  tempArtifacts: [],
  leftAnnotations: { 1: [{ diffId: 'd1', kind: 'modified', pageNumber: 1, itemIndexes: [0] }] },
  rightAnnotations: { 1: [{ diffId: 'd1', kind: 'modified', pageNumber: 1, itemIndexes: [0] }] },
  sidebarItems: [
    {
      id: 'd1',
      kind: 'modified',
      summary: '付款期限 7 天 → 10 天',
      leftPageNumber: 1,
      rightPageNumber: 1
    }
  ]
} as const

describe('CompareScreen', () => {
  beforeEach(() => {
    api.readPdfFile.mockReset()
    api.readPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
  })

  it('loads PDF bytes for both panes before rendering the documents', async () => {
    api.readPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))

    render(<CompareScreen result={result} onReset={() => undefined} />)

    await waitFor(() => {
      expect(api.readPdfFile).toHaveBeenCalledTimes(2)
      expect(api.readPdfFile).toHaveBeenNthCalledWith(1, '/tmp/old.pdf')
      expect(api.readPdfFile).toHaveBeenNthCalledWith(2, '/tmp/new.pdf')
    })
  })

  it('moves to the selected diff when the sidebar row is clicked', async () => {
    render(<CompareScreen result={result} onReset={() => undefined} />)

    await waitFor(() => {
      expect(api.readPdfFile).toHaveBeenCalledTimes(2)
    })

    fireEvent.click(screen.getByText('付款期限 7 天 → 10 天'))
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })

  it('toggles the diff sidebar from the toolbar', async () => {
    render(<CompareScreen result={result} onReset={() => undefined} />)

    await waitFor(() => {
      expect(api.readPdfFile).toHaveBeenCalledTimes(2)
    })

    expect(screen.getByLabelText('差异列表')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '隐藏差异列表' }))
    expect(screen.queryByLabelText('差异列表')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '显示差异列表' }))
    expect(screen.getByLabelText('差异列表')).toBeInTheDocument()
  })
})
