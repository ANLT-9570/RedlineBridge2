// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('main window preload path', () => {
  it('points BrowserWindow preload to the built preload module', () => {
    const mainEntry = readFileSync(new URL('../../src/main/index.ts', import.meta.url), 'utf8')

    expect(mainEntry).toContain("preload: path.join(__dirname, '../preload/index.cjs')")
  })
})
