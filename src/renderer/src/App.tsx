import { useState } from 'react'
import type { CompareResult } from '../../shared/contracts'
import CompareScreen from './screens/CompareScreen'
import HomeScreen from './screens/HomeScreen'
import './styles/app.css'

export default function App() {
  const [result, setResult] = useState<CompareResult | null>(null)

  async function handleReset() {
    if (result?.tempArtifacts.length) {
      await window.redlineBridge.cleanupTempArtifacts(result.tempArtifacts)
    }

    setResult(null)
  }

  if (result) {
    return <CompareScreen result={result} onReset={() => void handleReset()} />
  }

  return <HomeScreen onCompared={setResult} />
}
