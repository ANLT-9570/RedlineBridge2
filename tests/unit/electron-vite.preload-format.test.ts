// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('electron-vite preload build', () => {
  it('forces preload output to commonjs', () => {
    const configFile = readFileSync(new URL('../../electron.vite.config.ts', import.meta.url), 'utf8')

    expect(configFile).toContain("format: 'cjs'")
  })
})
