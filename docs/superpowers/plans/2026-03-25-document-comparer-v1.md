# 文档对比器 V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Electron desktop app for macOS and Windows that compares two same-format documents (`.docx` ↔ `.docx`, text PDF ↔ text PDF), preserves original-looking layout, and highlights diffs in a side-by-side viewer.

**Architecture:** Normalize both supported inputs into a single PDF viewing pipeline. Native PDFs stay as-is; `.docx` files are exported to temporary PDFs with locally installed Microsoft Word, then the compare engine extracts PDF text items, computes block/token diffs in the Electron main process, and returns annotation view models to a React renderer built on `react-pdf`.

**Tech Stack:** Electron, React, TypeScript, electron-vite, react-pdf, pdfjs-dist, diff, Vitest, React Testing Library, pdf-lib

---

## Scope check

The approved spec is focused enough for a single implementation plan. The key YAGNI choice is to **avoid building a native `.docx` renderer in V1**. Instead, V1 treats Word-vs-Word as **Word → PDF export + the same PDF diff/viewer path used for PDF-vs-PDF**.

## Planned file structure

### Root
- Create: `package.json` — app scripts and dependencies
- Create: `tsconfig.json` — shared TypeScript config
- Create: `electron.vite.config.ts` — Electron + Vite build config
- Create: `vitest.config.ts` — unit/component test config
- Create: `.gitignore` — ignore build output and temp files

### Main process
- Create: `src/main/index.ts` — create the Electron window and register IPC handlers
- Create: `src/main/ipc/registerDialogIpc.ts` — secure file-picker IPC
- Create: `src/main/ipc/registerCompareIpc.ts` — compare request IPC
- Create: `src/main/services/compare/validateCompareRequest.ts` — enforce same-format input and supported extensions
- Create: `src/main/services/compare/compareDocuments.ts` — top-level compare orchestration
- Create: `src/main/services/compare/cleanupTempArtifacts.ts` — delete temporary PDFs created from `.docx`
- Create: `src/main/services/pdf/readPdfDocument.ts` — load PDF bytes and page metadata
- Create: `src/main/services/pdf/extractPdfTextItems.ts` — extract text items, coordinates, and item indexes
- Create: `src/main/services/diff/groupTextItemsIntoBlocks.ts` — convert text items into line/paragraph-ish compare blocks
- Create: `src/main/services/diff/computeDocumentDiff.ts` — classify added / removed / modified blocks and token changes
- Create: `src/main/services/diff/buildCompareViewModel.ts` — map diff results into sidebar rows and per-page annotations
- Create: `src/main/services/word/exportDocxToPdf.ts` — platform-agnostic `.docx` → PDF export entry point
- Create: `src/main/services/word/buildWindowsWordCommand.ts` — PowerShell COM automation command builder
- Create: `src/main/services/word/buildMacWordCommand.ts` — AppleScript automation command builder
- Create: `src/main/services/files/createTempPdfPath.ts` — create temporary output paths under the OS temp dir

### Shared / preload
- Create: `src/shared/contracts.ts` — shared request/response types used by main and renderer
- Create: `src/preload/index.ts` — `contextBridge` API exposure
- Create: `src/renderer/src/types/window.d.ts` — type the `window.redlineBridge` API

### Renderer
- Create: `src/renderer/index.html` — renderer entry HTML
- Create: `src/renderer/src/main.tsx` — React bootstrap
- Create: `src/renderer/src/App.tsx` — screen switching and top-level state
- Create: `src/renderer/src/hooks/useCompareController.ts` — file selection and compare flow state
- Create: `src/renderer/src/screens/HomeScreen.tsx` — file pickers and compare action
- Create: `src/renderer/src/screens/CompareScreen.tsx` — side-by-side result screen
- Create: `src/renderer/src/components/FilePickerCard.tsx` — reusable left/right file picker
- Create: `src/renderer/src/components/CompareToolbar.tsx` — previous/next diff navigation and sidebar toggle
- Create: `src/renderer/src/components/DiffSidebar.tsx` — diff list and click-to-jump UI
- Create: `src/renderer/src/components/PdfViewerPane.tsx` — `react-pdf` viewer with text coloring + placeholder overlays
- Create: `src/renderer/src/components/InlineError.tsx` — visible error state for unsupported inputs / export failures
- Create: `src/renderer/src/styles/app.css` — layout and diff color styles

### Tests
- Create: `tests/helpers/createPdfFixture.ts` — generate simple PDFs in temp files for tests
- Create: `tests/unit/renderer/App.test.tsx`
- Create: `tests/unit/main/services/compare/validateCompareRequest.test.ts`
- Create: `tests/unit/main/services/pdf/extractPdfTextItems.test.ts`
- Create: `tests/unit/main/services/diff/computeDocumentDiff.test.ts`
- Create: `tests/unit/main/services/word/exportDocxToPdf.test.ts`
- Create: `tests/unit/main/services/compare/compareDocuments.test.ts`
- Create: `tests/unit/renderer/HomeScreen.test.tsx`
- Create: `tests/unit/renderer/CompareScreen.test.tsx`
- Create: `tests/unit/main/services/compare/cleanupTempArtifacts.test.ts`
- Create: `tests/unit/renderer/HomeScreen.error.test.tsx`

## Shared contracts to lock before coding

Use these shapes everywhere; do not invent per-layer variants unless needed.

```ts
export type SupportedFormat = 'docx' | 'pdf'
export type DiffKind = 'added' | 'removed' | 'modified'

export interface CompareRequest {
  leftFilePath: string
  rightFilePath: string
}

export interface TextItemRef {
  pageNumber: number
  itemIndex: number
  text: string
  x: number
  y: number
  width: number
  height: number
}

export interface DiffSidebarItem {
  id: string
  kind: DiffKind
  summary: string
  leftPageNumber: number | null
  rightPageNumber: number | null
}

export interface PageAnnotation {
  diffId: string
  kind: DiffKind
  pageNumber: number
  itemIndexes: number[]
  placeholder?: {
    x: number
    y: number
    label: string
  }
}

export interface CompareResult {
  format: SupportedFormat
  leftDisplayPdfPath: string
  rightDisplayPdfPath: string
  sidebarItems: DiffSidebarItem[]
  leftAnnotations: Record<number, PageAnnotation[]>
  rightAnnotations: Record<number, PageAnnotation[]>
  tempArtifacts: string[]
}

export interface RedlineBridgeApi {
  pickFile(): Promise<string | null>
  compareDocuments(request: CompareRequest): Promise<CompareResult>
}
```

---

### Task 1: Bootstrap the Electron + React shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `electron.vite.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/styles/app.css`
- Test: `tests/unit/renderer/App.test.tsx`

- [ ] **Step 1: Write the package and build config**

```json
{
  "name": "redlinebridge2",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test:unit": "vitest run"
  },
  "dependencies": {
    "diff": "^7.0.0",
    "electron": "^37.0.0",
    "pdfjs-dist": "^5.4.54",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-pdf": "^10.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^4.4.1",
    "electron-vite": "^3.1.0",
    "jsdom": "^26.1.0",
    "pdf-lib": "^1.17.1",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `added ... packages` and a new `package-lock.json`

- [ ] **Step 3: Write the failing renderer smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../../src/renderer/src/App'

describe('App', () => {
  it('shows the empty compare shell', () => {
    render(<App />)
    expect(screen.getByText('RedlineBridge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始对比' })).toBeDisabled()
  })
})
```

- [ ] **Step 4: Run the smoke test to verify it fails**

Run: `npm run test:unit -- tests/unit/renderer/App.test.tsx`
Expected: FAIL because `App` and the button do not exist yet

- [ ] **Step 5: Write the minimal Electron/React shell**

```ts
// src/main/index.ts
import { app, BrowserWindow } from 'electron'
import path from 'node:path'

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    return
  }

  window.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(createWindow)
```

```tsx
// src/renderer/src/App.tsx
import './styles/app.css'

export default function App() {
  return (
    <main className="app-shell">
      <h1>RedlineBridge</h1>
      <div className="picker-grid">
        <section className="picker-card">左文档</section>
        <section className="picker-card">右文档</section>
      </div>
      <button disabled>开始对比</button>
    </main>
  )
}
```

- [ ] **Step 6: Re-run the smoke test**

Run: `npm run test:unit -- tests/unit/renderer/App.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit the bootstrap**

```bash
git add package.json package-lock.json tsconfig.json electron.vite.config.ts vitest.config.ts .gitignore src/main/index.ts src/preload/index.ts src/renderer/index.html src/renderer/src/main.tsx src/renderer/src/App.tsx src/renderer/src/styles/app.css tests/unit/renderer/App.test.tsx
git commit -m "$(cat <<'EOF'
chore: scaffold electron desktop shell
EOF
)"
```

### Task 2: Lock the same-format validation and secure IPC contract

**Files:**
- Create: `src/shared/contracts.ts`
- Create: `src/main/ipc/registerDialogIpc.ts`
- Create: `src/main/ipc/registerCompareIpc.ts`
- Create: `src/main/services/compare/validateCompareRequest.ts`
- Create: `src/renderer/src/types/window.d.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/main/index.ts`
- Test: `tests/unit/main/services/compare/validateCompareRequest.test.ts`

- [ ] **Step 1: Write the failing validation test**

```ts
import { describe, expect, it } from 'vitest'
import { validateCompareRequest } from '../../../../../src/main/services/compare/validateCompareRequest'

describe('validateCompareRequest', () => {
  it('rejects mixed formats', () => {
    expect(() =>
      validateCompareRequest({
        leftFilePath: '/tmp/old.docx',
        rightFilePath: '/tmp/new.pdf'
      })
    ).toThrow('当前版本仅支持同格式对比')
  })
})
```

- [ ] **Step 2: Run the validation test to verify it fails**

Run: `npm run test:unit -- tests/unit/main/services/compare/validateCompareRequest.test.ts`
Expected: FAIL because the module does not exist

- [ ] **Step 3: Implement the shared contract and IPC surface**

```ts
// src/main/services/compare/validateCompareRequest.ts
import path from 'node:path'
import type { CompareRequest, SupportedFormat } from '../../../shared/contracts'

function toFormat(filePath: string): SupportedFormat {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.pdf') return 'pdf'
  if (ext === '.docx') return 'docx'
  throw new Error('当前版本仅支持 .docx 和 PDF')
}

export function validateCompareRequest(request: CompareRequest) {
  const leftFormat = toFormat(request.leftFilePath)
  const rightFormat = toFormat(request.rightFilePath)

  if (leftFormat !== rightFormat) {
    throw new Error('当前版本仅支持同格式对比')
  }

  return { format: leftFormat }
}
```

```ts
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import type { CompareRequest, RedlineBridgeApi } from '../shared/contracts'

const api: RedlineBridgeApi = {
  pickFile: () => ipcRenderer.invoke('dialog:pick-file'),
  compareDocuments: (request: CompareRequest) => ipcRenderer.invoke('compare:run', request)
}

contextBridge.exposeInMainWorld('redlineBridge', api)
```

- [ ] **Step 4: Register the IPC handlers in the main process**

```ts
// src/main/index.ts
import { registerDialogIpc } from './ipc/registerDialogIpc'
import { registerCompareIpc } from './ipc/registerCompareIpc'

app.whenReady().then(() => {
  registerDialogIpc()
  registerCompareIpc()
  createWindow()
})
```

- [ ] **Step 5: Re-run the validation test**

Run: `npm run test:unit -- tests/unit/main/services/compare/validateCompareRequest.test.ts`
Expected: PASS

- [ ] **Step 6: Commit the contract layer**

```bash
git add src/shared/contracts.ts src/main/ipc/registerDialogIpc.ts src/main/ipc/registerCompareIpc.ts src/main/services/compare/validateCompareRequest.ts src/renderer/src/types/window.d.ts src/preload/index.ts src/main/index.ts tests/unit/main/services/compare/validateCompareRequest.test.ts
git commit -m "$(cat <<'EOF'
feat: add secure compare ipc contracts
EOF
)"
```

### Task 3: Extract ordered text items from PDF pages

**Files:**
- Create: `src/main/services/pdf/readPdfDocument.ts`
- Create: `src/main/services/pdf/extractPdfTextItems.ts`
- Create: `tests/helpers/createPdfFixture.ts`
- Test: `tests/unit/main/services/pdf/extractPdfTextItems.test.ts`

- [ ] **Step 1: Write the failing PDF extraction test**

```ts
import { describe, expect, it } from 'vitest'
import { createPdfFixture } from '../../../../../../tests/helpers/createPdfFixture'
import { extractPdfTextItems } from '../../../../../src/main/services/pdf/extractPdfTextItems'

describe('extractPdfTextItems', () => {
  it('returns page numbers and ordered item indexes', async () => {
    const pdfPath = await createPdfFixture([
      ['第一段文字'],
      ['第二段文字']
    ])

    const items = await extractPdfTextItems(pdfPath)

    expect(items[0]).toMatchObject({ pageNumber: 1, itemIndex: 0 })
    expect(items.map((item) => item.text).join('')).toContain('第一段文字')
  })
})
```

- [ ] **Step 2: Run the PDF extraction test to verify it fails**

Run: `npm run test:unit -- tests/unit/main/services/pdf/extractPdfTextItems.test.ts`
Expected: FAIL because `extractPdfTextItems` does not exist

- [ ] **Step 3: Implement the PDF loader and text extractor**

```ts
// src/main/services/pdf/extractPdfTextItems.ts
import fs from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { TextItemRef } from '../../../shared/contracts'

export async function extractPdfTextItems(pdfPath: string): Promise<TextItemRef[]> {
  const buffer = await fs.readFile(pdfPath)
  const document = await getDocument({ data: new Uint8Array(buffer) }).promise
  const items: TextItemRef[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()

    content.items.forEach((item, itemIndex) => {
      if (!('str' in item)) return
      items.push({
        pageNumber,
        itemIndex,
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height
      })
    })
  }

  return items
}
```

- [ ] **Step 4: Re-run the PDF extraction test**

Run: `npm run test:unit -- tests/unit/main/services/pdf/extractPdfTextItems.test.ts`
Expected: PASS

- [ ] **Step 5: Commit PDF extraction**

```bash
git add src/main/services/pdf/readPdfDocument.ts src/main/services/pdf/extractPdfTextItems.ts tests/helpers/createPdfFixture.ts tests/unit/main/services/pdf/extractPdfTextItems.test.ts
git commit -m "$(cat <<'EOF'
feat: extract text items from pdf pages
EOF
)"
```

### Task 4: Build block grouping and diff classification

**Files:**
- Create: `src/main/services/diff/groupTextItemsIntoBlocks.ts`
- Create: `src/main/services/diff/computeDocumentDiff.ts`
- Create: `src/main/services/diff/buildCompareViewModel.ts`
- Test: `tests/unit/main/services/diff/computeDocumentDiff.test.ts`

- [ ] **Step 1: Write the failing diff classification test**

```ts
import { describe, expect, it } from 'vitest'
import { computeDocumentDiff } from '../../../../../src/main/services/diff/computeDocumentDiff'
import type { TextItemRef } from '../../../../../src/shared/contracts'

const oldItems: TextItemRef[] = [
  { pageNumber: 1, itemIndex: 0, text: '付款期限为7天', x: 10, y: 700, width: 80, height: 12 }
]

const newItems: TextItemRef[] = [
  { pageNumber: 1, itemIndex: 0, text: '付款期限为10天', x: 10, y: 700, width: 80, height: 12 }
]

describe('computeDocumentDiff', () => {
  it('classifies a small text change as one modified diff', () => {
    const result = computeDocumentDiff(oldItems, newItems)
    expect(result.sidebarItems).toHaveLength(1)
    expect(result.sidebarItems[0].kind).toBe('modified')
  })
})
```

- [ ] **Step 2: Run the diff classification test to verify it fails**

Run: `npm run test:unit -- tests/unit/main/services/diff/computeDocumentDiff.test.ts`
Expected: FAIL because `computeDocumentDiff` does not exist

- [ ] **Step 3: Implement block grouping and token diffing**

```ts
// src/main/services/diff/groupTextItemsIntoBlocks.ts
import type { TextItemRef } from '../../../shared/contracts'

export function groupTextItemsIntoBlocks(items: TextItemRef[]) {
  const sorted = [...items].sort((a, b) => a.pageNumber - b.pageNumber || b.y - a.y || a.x - b.x)
  return sorted.map((item) => ({
    pageNumber: item.pageNumber,
    text: item.text.trim(),
    itemIndexes: [item.itemIndex],
    anchor: { x: item.x, y: item.y }
  }))
}
```

```ts
// src/main/services/diff/computeDocumentDiff.ts
import { diffWordsWithSpace } from 'diff'
import { groupTextItemsIntoBlocks } from './groupTextItemsIntoBlocks'
import { buildCompareViewModel } from './buildCompareViewModel'
import type { TextItemRef } from '../../../shared/contracts'

export function computeDocumentDiff(leftItems: TextItemRef[], rightItems: TextItemRef[]) {
  const leftBlocks = groupTextItemsIntoBlocks(leftItems)
  const rightBlocks = groupTextItemsIntoBlocks(rightItems)

  const rawDiffs = leftBlocks.map((leftBlock, index) => {
    const rightBlock = rightBlocks[index]
    if (!rightBlock) return { kind: 'removed' as const, leftBlock, rightBlock: null, tokens: [] }
    if (leftBlock.text === rightBlock.text) return null

    const tokens = diffWordsWithSpace(leftBlock.text, rightBlock.text)
    return { kind: 'modified' as const, leftBlock, rightBlock, tokens }
  }).filter(Boolean)

  return buildCompareViewModel(rawDiffs, leftBlocks, rightBlocks)
}
```

- [ ] **Step 4: Re-run the diff classification test**

Run: `npm run test:unit -- tests/unit/main/services/diff/computeDocumentDiff.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the diff engine**

```bash
git add src/main/services/diff/groupTextItemsIntoBlocks.ts src/main/services/diff/computeDocumentDiff.ts src/main/services/diff/buildCompareViewModel.ts tests/unit/main/services/diff/computeDocumentDiff.test.ts
git commit -m "$(cat <<'EOF'
feat: compute block-level document diffs
EOF
)"
```

### Task 5: Export `.docx` files to temporary PDFs with local Microsoft Word

**Files:**
- Create: `src/main/services/files/createTempPdfPath.ts`
- Create: `src/main/services/word/buildWindowsWordCommand.ts`
- Create: `src/main/services/word/buildMacWordCommand.ts`
- Create: `src/main/services/word/exportDocxToPdf.ts`
- Test: `tests/unit/main/services/word/exportDocxToPdf.test.ts`

- [ ] **Step 1: Write the failing Word export test**

```ts
import { describe, expect, it } from 'vitest'
import { buildWindowsWordCommand } from '../../../../../src/main/services/word/buildWindowsWordCommand'

describe('buildWindowsWordCommand', () => {
  it('builds a powershell command that opens Word and writes a PDF', () => {
    const command = buildWindowsWordCommand('C:/docs/a.docx', 'C:/tmp/a.pdf')
    expect(command.file).toBe('powershell.exe')
    expect(command.args.join(' ')).toContain('Word.Application')
    expect(command.args.join(' ')).toContain('ExportAsFixedFormat')
  })
})
```

- [ ] **Step 2: Run the Word export test to verify it fails**

Run: `npm run test:unit -- tests/unit/main/services/word/exportDocxToPdf.test.ts`
Expected: FAIL because the Word command builder does not exist

- [ ] **Step 3: Implement temp-path creation and platform command builders**

```ts
// src/main/services/files/createTempPdfPath.ts
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

export async function createTempPdfPath(prefix: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'redlinebridge-'))
  return path.join(dir, `${prefix}-${crypto.randomUUID()}.pdf`)
}
```

```ts
// src/main/services/word/buildWindowsWordCommand.ts
export function buildWindowsWordCommand(inputPath: string, outputPath: string) {
  const script = [
    '$word = New-Object -ComObject Word.Application',
    '$word.Visible = $false',
    `$document = $word.Documents.Open('${inputPath.replace(/'/g, "''")}')`,
    `$document.ExportAsFixedFormat('${outputPath.replace(/'/g, "''")}', 17)`,
    '$document.Close()',
    '$word.Quit()'
  ].join('; ')

  return { file: 'powershell.exe', args: ['-NoProfile', '-Command', script] }
}
```

```ts
// src/main/services/word/exportDocxToPdf.ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { buildMacWordCommand } from './buildMacWordCommand'
import { buildWindowsWordCommand } from './buildWindowsWordCommand'

const execFileAsync = promisify(execFile)

export async function exportDocxToPdf(inputPath: string, outputPath: string) {
  const command = process.platform === 'win32'
    ? buildWindowsWordCommand(inputPath, outputPath)
    : buildMacWordCommand(inputPath, outputPath)

  await execFileAsync(command.file, command.args)
  return outputPath
}
```

- [ ] **Step 4: Re-run the Word export test**

Run: `npm run test:unit -- tests/unit/main/services/word/exportDocxToPdf.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the Word export adapter**

```bash
git add src/main/services/files/createTempPdfPath.ts src/main/services/word/buildWindowsWordCommand.ts src/main/services/word/buildMacWordCommand.ts src/main/services/word/exportDocxToPdf.ts tests/unit/main/services/word/exportDocxToPdf.test.ts
git commit -m "$(cat <<'EOF'
feat: export docx to pdf with local word
EOF
)"
```

### Task 6: Orchestrate the local compare pipeline in the main process

**Files:**
- Create: `src/main/services/compare/compareDocuments.ts`
- Modify: `src/main/ipc/registerCompareIpc.ts`
- Test: `tests/unit/main/services/compare/compareDocuments.test.ts`

- [ ] **Step 1: Write the failing compare orchestration test**

```ts
import { describe, expect, it, vi } from 'vitest'
import { compareDocuments } from '../../../../../src/main/services/compare/compareDocuments'

vi.mock('../../../../../src/main/services/word/exportDocxToPdf', () => ({
  exportDocxToPdf: vi.fn(async (inputPath: string) => inputPath.replace(/\.docx$/, '.pdf'))
}))

vi.mock('../../../../../src/main/services/pdf/extractPdfTextItems', () => ({
  extractPdfTextItems: vi.fn(async () => [
    { pageNumber: 1, itemIndex: 0, text: '付款期限为10天', x: 10, y: 700, width: 80, height: 12 }
  ])
}))

describe('compareDocuments', () => {
  it('normalizes docx inputs and returns display PDF paths', async () => {
    const result = await compareDocuments({
      leftFilePath: '/tmp/old.docx',
      rightFilePath: '/tmp/new.docx'
    })

    expect(result.leftDisplayPdfPath.endsWith('.pdf')).toBe(true)
    expect(result.rightDisplayPdfPath.endsWith('.pdf')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the orchestration test to verify it fails**

Run: `npm run test:unit -- tests/unit/main/services/compare/compareDocuments.test.ts`
Expected: FAIL because `compareDocuments` does not exist

- [ ] **Step 3: Implement the compare pipeline**

```ts
// src/main/services/compare/compareDocuments.ts
import { validateCompareRequest } from './validateCompareRequest'
import { createTempPdfPath } from '../files/createTempPdfPath'
import { exportDocxToPdf } from '../word/exportDocxToPdf'
import { extractPdfTextItems } from '../pdf/extractPdfTextItems'
import { computeDocumentDiff } from '../diff/computeDocumentDiff'
import type { CompareRequest } from '../../../shared/contracts'

export async function compareDocuments(request: CompareRequest) {
  const { format } = validateCompareRequest(request)
  const tempArtifacts: string[] = []

  const leftDisplayPdfPath = format === 'docx'
    ? await exportDocxToPdf(request.leftFilePath, await createTempPdfPath('left'))
    : request.leftFilePath
  const rightDisplayPdfPath = format === 'docx'
    ? await exportDocxToPdf(request.rightFilePath, await createTempPdfPath('right'))
    : request.rightFilePath

  if (format === 'docx') {
    tempArtifacts.push(leftDisplayPdfPath, rightDisplayPdfPath)
  }

  const leftItems = await extractPdfTextItems(leftDisplayPdfPath)
  const rightItems = await extractPdfTextItems(rightDisplayPdfPath)
  const viewModel = computeDocumentDiff(leftItems, rightItems)

  return {
    format,
    leftDisplayPdfPath,
    rightDisplayPdfPath,
    tempArtifacts,
    ...viewModel
  }
}
```

- [ ] **Step 4: Wire the IPC handler to the compare pipeline**

```ts
// src/main/ipc/registerCompareIpc.ts
import { ipcMain } from 'electron'
import { compareDocuments } from '../services/compare/compareDocuments'

export function registerCompareIpc() {
  ipcMain.handle('compare:run', async (_event, request) => compareDocuments(request))
}
```

- [ ] **Step 5: Re-run the orchestration test**

Run: `npm run test:unit -- tests/unit/main/services/compare/compareDocuments.test.ts`
Expected: PASS

- [ ] **Step 6: Commit the compare orchestrator**

```bash
git add src/main/services/compare/compareDocuments.ts src/main/ipc/registerCompareIpc.ts tests/unit/main/services/compare/compareDocuments.test.ts
git commit -m "$(cat <<'EOF'
feat: orchestrate local compare pipeline
EOF
)"
```

### Task 7: Build the home screen and compare job flow

**Files:**
- Create: `src/renderer/src/hooks/useCompareController.ts`
- Create: `src/renderer/src/components/FilePickerCard.tsx`
- Create: `src/renderer/src/screens/HomeScreen.tsx`
- Modify: `src/renderer/src/App.tsx`
- Test: `tests/unit/renderer/HomeScreen.test.tsx`

- [ ] **Step 1: Write the failing home-screen interaction test**

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeScreen from '../../../src/renderer/src/screens/HomeScreen'

const api = {
  pickFile: vi.fn()
    .mockResolvedValueOnce('/tmp/old.pdf')
    .mockResolvedValueOnce('/tmp/new.pdf'),
  compareDocuments: vi.fn().mockResolvedValue({
    format: 'pdf',
    leftDisplayPdfPath: '/tmp/old.pdf',
    rightDisplayPdfPath: '/tmp/new.pdf',
    sidebarItems: [],
    leftAnnotations: {},
    rightAnnotations: {},
    tempArtifacts: []
  })
}

Object.assign(window, { redlineBridge: api })

describe('HomeScreen', () => {
  it('enables compare after both files are selected', async () => {
    render(<HomeScreen onCompared={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '选择左文档' }))
    fireEvent.click(screen.getByRole('button', { name: '选择右文档' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '开始对比' })).toBeEnabled()
    })
  })
})
```

- [ ] **Step 2: Run the home-screen test to verify it fails**

Run: `npm run test:unit -- tests/unit/renderer/HomeScreen.test.tsx`
Expected: FAIL because `HomeScreen` does not exist

- [ ] **Step 3: Implement the compare controller and home screen**

```tsx
// src/renderer/src/hooks/useCompareController.ts
import { useState } from 'react'
import type { CompareResult } from '../../../shared/contracts'

export function useCompareController(onCompared: (result: CompareResult) => void) {
  const [leftFilePath, setLeftFilePath] = useState<string | null>(null)
  const [rightFilePath, setRightFilePath] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const canCompare = Boolean(leftFilePath && rightFilePath)

  async function pickLeft() {
    const value = await window.redlineBridge.pickFile()
    setLeftFilePath(value)
  }

  async function pickRight() {
    const value = await window.redlineBridge.pickFile()
    setRightFilePath(value)
  }

  async function runCompare() {
    if (!leftFilePath || !rightFilePath) return
    setIsRunning(true)
    try {
      const result = await window.redlineBridge.compareDocuments({ leftFilePath, rightFilePath })
      onCompared(result)
    } finally {
      setIsRunning(false)
    }
  }

  return { leftFilePath, rightFilePath, isRunning, canCompare, pickLeft, pickRight, runCompare }
}
```

- [ ] **Step 4: Re-run the home-screen test**

Run: `npm run test:unit -- tests/unit/renderer/HomeScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the home flow**

```bash
git add src/renderer/src/hooks/useCompareController.ts src/renderer/src/components/FilePickerCard.tsx src/renderer/src/screens/HomeScreen.tsx src/renderer/src/App.tsx tests/unit/renderer/HomeScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat: add home compare flow
EOF
)"
```

### Task 8: Render the side-by-side compare viewer with diff navigation

**Files:**
- Create: `src/renderer/src/components/CompareToolbar.tsx`
- Create: `src/renderer/src/components/DiffSidebar.tsx`
- Create: `src/renderer/src/components/PdfViewerPane.tsx`
- Create: `src/renderer/src/screens/CompareScreen.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/styles/app.css`
- Test: `tests/unit/renderer/CompareScreen.test.tsx`

- [ ] **Step 1: Write the failing compare-screen test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CompareScreen from '../../../src/renderer/src/screens/CompareScreen'

const result = {
  format: 'pdf',
  leftDisplayPdfPath: '/tmp/old.pdf',
  rightDisplayPdfPath: '/tmp/new.pdf',
  tempArtifacts: [],
  leftAnnotations: { 1: [{ diffId: 'd1', kind: 'modified', pageNumber: 1, itemIndexes: [0] }] },
  rightAnnotations: { 1: [{ diffId: 'd1', kind: 'modified', pageNumber: 1, itemIndexes: [0] }] },
  sidebarItems: [{ id: 'd1', kind: 'modified', summary: '付款期限 7 天 → 10 天', leftPageNumber: 1, rightPageNumber: 1 }]
} as const

describe('CompareScreen', () => {
  it('moves to the selected diff when the sidebar row is clicked', () => {
    render(<CompareScreen result={result} onReset={() => undefined} />)
    fireEvent.click(screen.getByText('付款期限 7 天 → 10 天'))
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the compare-screen test to verify it fails**

Run: `npm run test:unit -- tests/unit/renderer/CompareScreen.test.tsx`
Expected: FAIL because `CompareScreen` does not exist

- [ ] **Step 3: Implement the compare screen and viewer components**

```tsx
// src/renderer/src/components/PdfViewerPane.tsx
import { Document, Page } from 'react-pdf'
import type { PageAnnotation } from '../../../shared/contracts'

interface PdfViewerPaneProps {
  pdfPath: string
  pageNumber: number
  annotations: PageAnnotation[]
}

export default function PdfViewerPane({ pdfPath, pageNumber, annotations }: PdfViewerPaneProps) {
  const itemKinds = new Map(annotations.flatMap((annotation) =>
    annotation.itemIndexes.map((itemIndex) => [`${annotation.pageNumber}:${itemIndex}`, annotation.kind] as const)
  ))

  return (
    <div className="viewer-pane">
      <Document file={pdfPath}>
        <Page
          pageNumber={pageNumber}
          renderAnnotationLayer={false}
          renderTextLayer
          customTextRenderer={({ str, itemIndex }) => {
            const key = `${pageNumber}:${itemIndex}`
            const kind = itemKinds.get(key)
            return kind ? `<span class="diff-${kind}">${str}</span>` : str
          }}
        />
      </Document>
    </div>
  )
}
```

```tsx
// src/renderer/src/screens/CompareScreen.tsx
import { useMemo, useState } from 'react'
import CompareToolbar from '../components/CompareToolbar'
import DiffSidebar from '../components/DiffSidebar'
import PdfViewerPane from '../components/PdfViewerPane'
import type { CompareResult } from '../../../shared/contracts'

export default function CompareScreen({ result, onReset }: { result: CompareResult; onReset: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = result.sidebarItems[activeIndex] ?? null

  const leftPage = active?.leftPageNumber ?? 1
  const rightPage = active?.rightPageNumber ?? 1

  return (
    <section className="compare-screen">
      <CompareToolbar
        currentIndex={activeIndex}
        total={result.sidebarItems.length}
        onPrevious={() => setActiveIndex((value) => Math.max(0, value - 1))}
        onNext={() => setActiveIndex((value) => Math.min(result.sidebarItems.length - 1, value + 1))}
        onReset={onReset}
      />
      <div className="compare-layout">
        <DiffSidebar items={result.sidebarItems} activeId={active?.id ?? null} onSelect={(id) => setActiveIndex(result.sidebarItems.findIndex((item) => item.id === id))} />
        <PdfViewerPane pdfPath={result.leftDisplayPdfPath} pageNumber={leftPage} annotations={result.leftAnnotations[leftPage] ?? []} />
        <PdfViewerPane pdfPath={result.rightDisplayPdfPath} pageNumber={rightPage} annotations={result.rightAnnotations[rightPage] ?? []} />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Re-run the compare-screen test**

Run: `npm run test:unit -- tests/unit/renderer/CompareScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the compare viewer**

```bash
git add src/renderer/src/components/CompareToolbar.tsx src/renderer/src/components/DiffSidebar.tsx src/renderer/src/components/PdfViewerPane.tsx src/renderer/src/screens/CompareScreen.tsx src/renderer/src/App.tsx src/renderer/src/styles/app.css tests/unit/renderer/CompareScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat: render side-by-side diff viewer
EOF
)"
```

### Task 9: Handle export failures, scanned PDFs, and temporary-file cleanup

**Files:**
- Create: `src/main/services/compare/cleanupTempArtifacts.ts`
- Create: `src/renderer/src/components/InlineError.tsx`
- Modify: `src/main/services/compare/compareDocuments.ts`
- Modify: `src/renderer/src/screens/HomeScreen.tsx`
- Test: `tests/unit/main/services/compare/cleanupTempArtifacts.test.ts`
- Test: `tests/unit/renderer/HomeScreen.error.test.tsx`

- [ ] **Step 1: Write the failing cleanup and error-state tests**

```ts
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
```

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import InlineError from '../../../src/renderer/src/components/InlineError'

describe('InlineError', () => {
  it('shows a readable local-processing error', () => {
    render(<InlineError message="无法提取 PDF 文字内容，请确认该文件不是扫描版 PDF。" />)
    expect(screen.getByText(/扫描版 PDF/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the failing tests**

Run: `npm run test:unit -- tests/unit/main/services/compare/cleanupTempArtifacts.test.ts tests/unit/renderer/HomeScreen.error.test.tsx`
Expected: FAIL because cleanup and error components do not exist

- [ ] **Step 3: Implement cleanup and user-visible error handling**

```ts
// src/main/services/compare/cleanupTempArtifacts.ts
import fs from 'node:fs/promises'

export async function cleanupTempArtifacts(paths: string[]) {
  await Promise.all(paths.map((filePath) => fs.rm(filePath, { force: true })))
}
```

```tsx
// src/renderer/src/components/InlineError.tsx
export default function InlineError({ message }: { message: string }) {
  return <p className="inline-error">{message}</p>
}
```

```ts
// src/main/services/compare/compareDocuments.ts
try {
  // existing compare pipeline
} catch (error) {
  throw new Error(error instanceof Error ? error.message : '本地对比失败，请重试')
}
```

- [ ] **Step 4: Re-run the cleanup and error-state tests**

Run: `npm run test:unit -- tests/unit/main/services/compare/cleanupTempArtifacts.test.ts tests/unit/renderer/HomeScreen.error.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the focused full-unit regression suite**

Run: `npm run test:unit -- tests/unit/renderer/App.test.tsx tests/unit/main/services/compare/validateCompareRequest.test.ts tests/unit/main/services/pdf/extractPdfTextItems.test.ts tests/unit/main/services/diff/computeDocumentDiff.test.ts tests/unit/main/services/word/exportDocxToPdf.test.ts tests/unit/main/services/compare/compareDocuments.test.ts tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/CompareScreen.test.tsx tests/unit/main/services/compare/cleanupTempArtifacts.test.ts tests/unit/renderer/HomeScreen.error.test.tsx`
Expected: PASS for all tests

- [ ] **Step 6: Commit hardening and cleanup**

```bash
git add src/main/services/compare/cleanupTempArtifacts.ts src/renderer/src/components/InlineError.tsx src/main/services/compare/compareDocuments.ts src/renderer/src/screens/HomeScreen.tsx tests/unit/main/services/compare/cleanupTempArtifacts.test.ts tests/unit/renderer/HomeScreen.error.test.tsx
git commit -m "$(cat <<'EOF'
fix: harden local compare errors and cleanup
EOF
)"
```

## Manual verification checklist

Run these manually after Task 9 and before claiming completion. Use `@superpowers/verification-before-completion` before reporting success.

1. Start the app:
   - Run: `npm run dev`
   - Expected: Electron window opens with the home screen

2. Verify PDF ↔ PDF:
   - Pick two text PDFs with one small sentence change
   - Expected: compare screen opens, one diff row appears, both panes show the changed text in color

3. Verify Word ↔ Word on Windows with Word installed:
   - Pick two `.docx` files
   - Expected: the app exports both to temp PDFs, opens the compare view, and does not show a format-mismatch error

4. Verify Word ↔ Word on macOS with Word installed:
   - Pick two `.docx` files
   - Expected: the AppleScript export path works and the compare view opens

5. Verify scanned-PDF rejection:
   - Pick an image-only PDF pair
   - Expected: visible error explaining that V1 requires text-extractable PDFs

6. Verify mixed-format rejection:
   - Pick one `.docx` and one `.pdf`
   - Expected: visible error `当前版本仅支持同格式对比`

7. Verify cleanup:
   - Close the compare view and reset back to home
   - Expected: temp PDFs created for `.docx` comparison are removed from the temp directory

## Debugging notes for implementers

- If the Windows Word export fails, use `@superpowers/systematic-debugging` and log the exact PowerShell stderr before changing the export strategy.
- If the macOS AppleScript syntax needs adjustment, fix the AppleScript only; do **not** replace the architecture with a custom `.docx` renderer.
- Keep the renderer dumb. PDF parsing, Word export, and diff calculation belong in the main process.
- Keep tests focused. Do not add broad snapshot tests.
