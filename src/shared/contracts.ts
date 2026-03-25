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
  cleanupTempArtifacts(paths: string[]): Promise<void>
}
