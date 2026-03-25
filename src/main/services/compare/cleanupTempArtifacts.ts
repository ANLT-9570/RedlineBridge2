import fs from 'node:fs/promises'

export async function cleanupTempArtifacts(paths: string[]) {
  await Promise.all(paths.map((filePath) => fs.rm(filePath, { force: true })))
}
