export interface WordCommand {
  file: string
  args: string[]
}

export function buildWindowsWordCommand(inputPath: string, outputPath: string): WordCommand {
  const script = [
    '$word = New-Object -ComObject Word.Application',
    '$word.Visible = $false',
    `$document = $word.Documents.Open('${inputPath.replace(/'/g, "''")}')`,
    `$document.ExportAsFixedFormat('${outputPath.replace(/'/g, "''")}', 17)`,
    '$document.Close()',
    '$word.Quit()'
  ].join('; ')

  return {
    file: 'powershell.exe',
    args: ['-NoProfile', '-Command', script]
  }
}
