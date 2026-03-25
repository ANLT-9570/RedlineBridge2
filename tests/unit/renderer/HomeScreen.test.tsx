import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeScreen from '../../../src/renderer/src/screens/HomeScreen'

const api = {
  pickFile: vi.fn().mockResolvedValueOnce('/tmp/old.pdf').mockResolvedValueOnce('/tmp/new.pdf'),
  compareDocuments: vi.fn().mockResolvedValue({
    format: 'pdf',
    leftDisplayPdfPath: '/tmp/old.pdf',
    rightDisplayPdfPath: '/tmp/new.pdf',
    sidebarItems: [],
    leftAnnotations: {},
    rightAnnotations: {},
    tempArtifacts: []
  })
}

Object.assign(window, { redlineBridge: api })

describe('HomeScreen', () => {
  it('enables compare after both files are selected', async () => {
    render(<HomeScreen onCompared={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '选择左文档' }))
    fireEvent.click(screen.getByRole('button', { name: '选择右文档' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '开始对比' })).toBeEnabled()
    })
  })
})
