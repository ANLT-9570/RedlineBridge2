import { Document, Page } from 'react-pdf'
import type { PageAnnotation } from '../../../shared/contracts'

interface PdfViewerPaneProps {
  pdfPath: string
  pageNumber: number
  annotations: PageAnnotation[]
}

export default function PdfViewerPane({ pdfPath, pageNumber, annotations }: PdfViewerPaneProps) {
  const itemKinds = new Map(
    annotations.flatMap((annotation) =>
      annotation.itemIndexes.map((itemIndex) => [`${annotation.pageNumber}:${itemIndex}`, annotation.kind] as const)
    )
  )
  const placeholders = annotations.filter((annotation) => annotation.placeholder)

  return (
    <div className="viewer-pane">
      <div className="viewer-pane__meta">{pdfPath}</div>
      <div className="viewer-pane__document">
        <Document file={pdfPath}>
          <Page
            pageNumber={pageNumber}
            renderAnnotationLayer={false}
            renderTextLayer
            customTextRenderer={({ str, itemIndex }) => {
              const key = `${pageNumber}:${itemIndex}`
              const kind = itemKinds.get(key)
              return kind ? `<span class="diff-${kind}">${str}</span>` : str
            }}
          />
        </Document>
        {placeholders.map((annotation) => (
          <div
            key={annotation.diffId}
            className={`diff-placeholder diff-placeholder--${annotation.kind}`}
            style={{ left: `${annotation.placeholder?.x ?? 0}px`, top: `${annotation.placeholder?.y ?? 0}px` }}
          >
            {annotation.placeholder?.label}
          </div>
        ))}
      </div>
    </div>
  )
}
