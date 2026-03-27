// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('electron-vite renderer worker loading strategy', () => {
  it('does not rely on renderer fs allow rules for pdfjs worker loading', () => {
    const source = readFileSync(new URL('../../electron.vite.config.ts', import.meta.url), 'utf8')

    expect(source).not.toContain('node_modules/pdfjs-dist')
    expect(source).not.toContain('server:')
  })
})
