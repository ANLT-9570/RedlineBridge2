// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PdfViewerPane browser compatibility', () => {
  it('does not import node-only URL helpers in the renderer component', () => {
    const source = readFileSync(new URL('../../../src/renderer/src/components/PdfViewerPane.tsx', import.meta.url), 'utf8')

    expect(source).not.toContain("from 'node:url'")
  })
})
