import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const cleanupTempArtifacts = vi.fn().mockResolvedValue(undefined)
const resultWithTempArtifacts = {
  format: 'pdf',
  leftDisplayPdfPath: '/tmp/left.pdf',
  rightDisplayPdfPath: '/tmp/right.pdf',
  sidebarItems: [],
  leftAnnotations: {},
  rightAnnotations: {},
  tempArtifacts: ['/tmp/a.pdf', '/tmp/b.pdf']
} as const

Object.assign(window, {
  redlineBridge: {
    pickFile: vi.fn(),
    compareDocuments: vi.fn(),
    cleanupTempArtifacts
  }
})

vi.mock('../../../src/renderer/src/screens/HomeScreen', () => ({
  default: ({ onCompared }: { onCompared: (result: typeof resultWithTempArtifacts) => void }) => (
    <button type="button" onClick={() => onCompared(resultWithTempArtifacts)}>
      open compare
    </button>
  )
}))

vi.mock('../../../src/renderer/src/screens/CompareScreen', () => ({
  default: ({ onReset }: { onReset: () => void }) => (
    <button type="button" onClick={onReset}>
      close compare
    </button>
  )
}))

import App from '../../../src/renderer/src/App'

describe('App', () => {
  it('cleans temp artifacts when resetting a compare result', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'open compare' }))
    fireEvent.click(screen.getByRole('button', { name: 'close compare' }))

    await waitFor(() => {
      expect(cleanupTempArtifacts).toHaveBeenCalledWith(resultWithTempArtifacts.tempArtifacts)
    })
  })
})
