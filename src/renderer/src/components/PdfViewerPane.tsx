import { Document, Page } from 'react-pdf'
import type { PageAnnotation } from '../../../shared/contracts'

function toPdfFileUrl(pdfPath: string) {
  return encodeURI(`file://${pdfPath}`)
}

interface PdfViewerPaneProps {
  pdfPath: string
  pdfData?: Uint8Array | null
  pageNumber: number
  annotations: PageAnnotation[]
}

export default function PdfViewerPane({ pdfPath, pdfData, pageNumber, annotations }: PdfViewerPaneProps) {
  const fileUrl = toPdfFileUrl(pdfPath)
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
        {pdfData === null ? (
          <div>正在加载 PDF…</div>
        ) : (
          <Document
            file={pdfData ? { data: pdfData } : fileUrl}
            onLoadError={(error) => {
              console.error('[pdf-load-error]', pdfData ? '[pdf-bytes]' : fileUrl, error)
            }}
            onSourceError={(error) => {
              console.error('[pdf-source-error]', pdfData ? '[pdf-bytes]' : fileUrl, error)
            }}
          >
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
        )}
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
