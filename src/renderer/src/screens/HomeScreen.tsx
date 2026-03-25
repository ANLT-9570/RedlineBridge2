import { useState } from 'react'
import type { CompareResult } from '../../../shared/contracts'
import InlineError from '../components/InlineError'
import FilePickerCard from '../components/FilePickerCard'
import { useCompareController } from '../hooks/useCompareController'

interface HomeScreenProps {
  onCompared: (result: CompareResult) => void
}

export default function HomeScreen({ onCompared }: HomeScreenProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { leftFilePath, rightFilePath, isRunning, canCompare, pickLeft, pickRight, runCompare } =
    useCompareController(onCompared, setErrorMessage)

  function handleCompare() {
    setErrorMessage(null)
    void runCompare()
  }

  return (
    <main className="app-shell">
      <h1>RedlineBridge</h1>
      <div className="picker-grid">
        <FilePickerCard
          title="左文档"
          buttonLabel="选择左文档"
          filePath={leftFilePath}
          onPick={pickLeft}
        />
        <FilePickerCard
          title="右文档"
          buttonLabel="选择右文档"
          filePath={rightFilePath}
          onPick={pickRight}
        />
      </div>
      {errorMessage ? <InlineError message={errorMessage} /> : null}
      <button type="button" disabled={!canCompare || isRunning} onClick={handleCompare}>
        开始对比
      </button>
    </main>
  )
}
