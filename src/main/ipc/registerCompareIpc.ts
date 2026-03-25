import { ipcMain } from 'electron'
import { compareDocuments } from '../services/compare/compareDocuments'
import { cleanupTempArtifacts } from '../services/compare/cleanupTempArtifacts'
import type { CompareRequest } from '../../shared/contracts'

const COMPARE_CHANNEL = 'compare:run'
const CLEANUP_TEMP_ARTIFACTS_CHANNEL = 'compare:cleanup-temp-artifacts'

export function registerCompareIpc() {
  ipcMain.handle(COMPARE_CHANNEL, async (_event, request: CompareRequest) => compareDocuments(request))
  ipcMain.handle(CLEANUP_TEMP_ARTIFACTS_CHANNEL, async (_event, paths: string[]) => cleanupTempArtifacts(paths))
}
