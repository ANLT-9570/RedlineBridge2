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
