import { contextBridge, ipcRenderer } from 'electron'
import type { CompareRequest, RedlineBridgeApi } from '../shared/contracts'

const api: RedlineBridgeApi = {
  pickFile: () => ipcRenderer.invoke('dialog:pick-file'),
  compareDocuments: (request: CompareRequest) => ipcRenderer.invoke('compare:run', request),
  cleanupTempArtifacts: (paths: string[]) => ipcRenderer.invoke('compare:cleanup-temp-artifacts', paths),
  readPdfFile: (filePath: string) => ipcRenderer.invoke('pdf:read-file', filePath)
}

contextBridge.exposeInMainWorld('redlineBridge', api)
