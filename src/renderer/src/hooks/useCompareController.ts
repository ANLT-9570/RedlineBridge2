import { useState } from 'react'
import type { CompareResult } from '../../../shared/contracts'

export function useCompareController(
  onCompared: (result: CompareResult) => void,
  onCompareError?: (message: string) => void
) {
  const [leftFilePath, setLeftFilePath] = useState<string | null>(null)
  const [rightFilePath, setRightFilePath] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const canCompare = Boolean(leftFilePath && rightFilePath)

  async function pickLeft() {
    const value = await window.redlineBridge.pickFile()
    setLeftFilePath(value)
  }

  async function pickRight() {
    const value = await window.redlineBridge.pickFile()
    setRightFilePath(value)
  }

  async function runCompare() {
    if (!leftFilePath || !rightFilePath) {
      return
    }

    setIsRunning(true)

    try {
      const result = await window.redlineBridge.compareDocuments({ leftFilePath, rightFilePath })
      onCompared(result)
    } catch (error) {
      onCompareError?.(error instanceof Error ? error.message : '本地对比失败，请重试')
    } finally {
      setIsRunning(false)
    }
  }

  return {
    leftFilePath,
    rightFilePath,
    isRunning,
    canCompare,
    pickLeft,
    pickRight,
    runCompare
  }
}
