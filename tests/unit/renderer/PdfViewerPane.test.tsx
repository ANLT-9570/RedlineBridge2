import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-pdf', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ pageNumber }: { pageNumber: number }) => <div>Page {pageNumber}</div>
}))

import PdfViewerPane from '../../../src/renderer/src/components/PdfViewerPane'

describe('PdfViewerPane', () => {
  it('renders placeholder annotations', () => {
    render(
      <PdfViewerPane
        pdfPath="/tmp/example.pdf"
        pageNumber={1}
        annotations={[
          {
            diffId: 'diff-1',
            kind: 'removed',
            pageNumber: 1,
            itemIndexes: [],
            placeholder: {
              x: 100,
              y: 200,
              label: '已删除'
            }
          }
        ]}
      />
    )

    expect(screen.getByText('已删除')).toBeInTheDocument()
  })
})
