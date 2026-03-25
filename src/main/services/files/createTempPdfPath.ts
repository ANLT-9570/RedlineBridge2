import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export async function createTempPdfPath(prefix: string) {
  const directoryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'redlinebridge-'))
  return path.join(directoryPath, `${prefix}-${crypto.randomUUID()}.pdf`)
}
