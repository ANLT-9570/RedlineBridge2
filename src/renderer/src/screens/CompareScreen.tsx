import { useEffect, useState } from 'react'
import type { CompareResult } from '../../../shared/contracts'
import CompareToolbar from '../components/CompareToolbar'
import DiffSidebar from '../components/DiffSidebar'
import PdfViewerPane from '../components/PdfViewerPane'

interface CompareScreenProps {
  result: CompareResult
  onReset: () => void
}

export default function CompareScreen({ result, onReset }: CompareScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [leftPdfData, setLeftPdfData] = useState<Uint8Array | null>(null)
  const [rightPdfData, setRightPdfData] = useState<Uint8Array | null>(null)
  const active = result.sidebarItems[activeIndex] ?? null
  const leftPage = active?.leftPageNumber ?? 1
  const rightPage = active?.rightPageNumber ?? 1

  useEffect(() => {
    let cancelled = false

    async function loadPdfData() {
      const [leftBytes, rightBytes] = await Promise.all([
        window.redlineBridge.readPdfFile(result.leftDisplayPdfPath),
        window.redlineBridge.readPdfFile(result.rightDisplayPdfPath)
      ])

      if (cancelled) {
        return
      }

      setLeftPdfData(leftBytes)
      setRightPdfData(rightBytes)
    }

    void loadPdfData()

    return () => {
      cancelled = true
    }
  }, [result.leftDisplayPdfPath, result.rightDisplayPdfPath])


  function selectDiff(id: string) {
    const nextIndex = result.sidebarItems.findIndex((item) => item.id === id)

    if (nextIndex >= 0) {
      setActiveIndex(nextIndex)
    }
  }

  return (
    <section className="compare-screen">
      <CompareToolbar
        currentIndex={activeIndex}
        total={result.sidebarItems.length}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={() => setSidebarVisible((value) => !value)}
        onPrevious={() => setActiveIndex((value) => Math.max(0, value - 1))}
        onNext={() => setActiveIndex((value) => Math.min(result.sidebarItems.length - 1, value + 1))}
        onReset={onReset}
      />
      <div className={sidebarVisible ? 'compare-layout' : 'compare-layout compare-layout--sidebar-hidden'}>
        {sidebarVisible ? (
          <DiffSidebar items={result.sidebarItems} activeId={active?.id ?? null} onSelect={selectDiff} />
        ) : null}
        <PdfViewerPane
          pdfPath={result.leftDisplayPdfPath}
          pdfData={leftPdfData}
          pageNumber={leftPage}
          annotations={result.leftAnnotations[leftPage] ?? []}
        />
        <PdfViewerPane
          pdfPath={result.rightDisplayPdfPath}
          pdfData={rightPdfData}
          pageNumber={rightPage}
          annotations={result.rightAnnotations[rightPage] ?? []}
        />
      </div>
    </section>
  )
}
