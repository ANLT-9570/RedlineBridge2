import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const documentSpy = vi.fn()

vi.mock('react-pdf', () => ({
  Document: ({ children, file }: { children: React.ReactNode; file: unknown }) => {
    documentSpy(file)
    return <div>{children}</div>
  },
  Page: ({ pageNumber }: { pageNumber: number }) => <div>Page {pageNumber}</div>
}))

import PdfViewerPane from '../../../src/renderer/src/components/PdfViewerPane'

describe('PdfViewerPane', () => {
  beforeEach(() => {
    documentSpy.mockReset()
  })

  it('passes PDF bytes to react-pdf instead of a local file URL', () => {
    render(
      <PdfViewerPane pdfPath="/tmp/example.pdf" pdfData={new Uint8Array([1, 2, 3])} pageNumber={1} annotations={[]} />
    )

    expect(documentSpy).toHaveBeenCalledWith({ data: new Uint8Array([1, 2, 3]) })
  })

  it('does not render the PDF document before bytes are available', () => {
    render(<PdfViewerPane pdfPath="/tmp/example.pdf" pdfData={null} pageNumber={1} annotations={[]} />)

    expect(documentSpy).not.toHaveBeenCalled()
    expect(screen.getByText('正在加载 PDF…')).toBeInTheDocument()
  })

  it('renders placeholder annotations', () => {
    render(
      <PdfViewerPane
        pdfPath="/tmp/example.pdf"
        pdfData={new Uint8Array([1, 2, 3])}
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
