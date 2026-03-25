import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomeScreen from '../../../src/renderer/src/screens/HomeScreen'
import InlineError from '../../../src/renderer/src/components/InlineError'

const api = {
  pickFile: vi.fn(),
  compareDocuments: vi.fn()
}

Object.assign(window, { redlineBridge: api })

describe('InlineError', () => {
  it('shows a readable local-processing error', () => {
    render(<InlineError message="无法提取 PDF 文字内容，请确认该文件不是扫描版 PDF。" />)

    expect(screen.getByText(/扫描版 PDF/)).toBeInTheDocument()
  })
})

describe('HomeScreen error state', () => {
  beforeEach(() => {
    api.pickFile.mockReset()
    api.compareDocuments.mockReset()
  })

  it('renders a compare failure message without calling onCompared', async () => {
    const onCompared = vi.fn()

    api.pickFile.mockResolvedValueOnce('/tmp/old.pdf').mockResolvedValueOnce('/tmp/new.pdf')
    api.compareDocuments.mockRejectedValueOnce(new Error('无法提取 PDF 文字内容，请确认该文件不是扫描版 PDF。'))

    render(<HomeScreen onCompared={onCompared} />)

    fireEvent.click(screen.getByRole('button', { name: '选择左文档' }))
    fireEvent.click(screen.getByRole('button', { name: '选择右文档' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '开始对比' })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: '开始对比' }))

    expect(await screen.findByText('无法提取 PDF 文字内容，请确认该文件不是扫描版 PDF。')).toBeInTheDocument()
    expect(onCompared).not.toHaveBeenCalled()
  })

  it('disables compare while a compare request is running', async () => {
    const onCompared = vi.fn()
    let resolveCompare: ((value: {
      format: 'pdf'
      leftDisplayPdfPath: string
      rightDisplayPdfPath: string
      sidebarItems: never[]
      leftAnnotations: {}
      rightAnnotations: {}
      tempArtifacts: never[]
    }) => void) | null = null

    api.pickFile.mockResolvedValueOnce('/tmp/old.pdf').mockResolvedValueOnce('/tmp/new.pdf')
    api.compareDocuments.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCompare = resolve
        })
    )

    render(<HomeScreen onCompared={onCompared} />)

    fireEvent.click(screen.getByRole('button', { name: '选择左文档' }))
    fireEvent.click(screen.getByRole('button', { name: '选择右文档' }))

    const compareButton = screen.getByRole('button', { name: '开始对比' })

    await waitFor(() => {
      expect(compareButton).toBeEnabled()
    })

    fireEvent.click(compareButton)

    await waitFor(() => {
      expect(compareButton).toBeDisabled()
    })

    resolveCompare?.({
      format: 'pdf',
      leftDisplayPdfPath: '/tmp/old.pdf',
      rightDisplayPdfPath: '/tmp/new.pdf',
      sidebarItems: [],
      leftAnnotations: {},
      rightAnnotations: {},
      tempArtifacts: []
    })

    await waitFor(() => {
      expect(onCompared).toHaveBeenCalled()
    })
  })
})
