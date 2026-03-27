// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('package.json electron entry', () => {
  it('points main to the electron-vite main output', () => {
    const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      main?: string
    }

    expect(packageJson.main).toBe('out/main/index.js')
  })
})
