// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('renderer pdf worker setup', () => {
  it('configures pdfjs worker source before rendering the app', () => {
    const source = readFileSync(new URL('../../../src/renderer/src/main.tsx', import.meta.url), 'utf8')

    expect(source).toContain('pdfjs.GlobalWorkerOptions.workerSrc')
    expect(source).toContain("react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url")
  })
})
