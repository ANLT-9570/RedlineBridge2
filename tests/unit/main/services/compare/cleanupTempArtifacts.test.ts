import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { cleanupTempArtifacts } from '../../../../../src/main/services/compare/cleanupTempArtifacts'

describe('cleanupTempArtifacts', () => {
  it('removes exported temporary pdf files', async () => {
    const filePath = path.join(os.tmpdir(), 'redlinebridge-cleanup-test.pdf')
    await fs.writeFile(filePath, 'x')

    await cleanupTempArtifacts([filePath])

    await expect(fs.access(filePath)).rejects.toThrow()
  })
})
