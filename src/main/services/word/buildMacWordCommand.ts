import type { WordCommand } from './buildWindowsWordCommand'

function escapeAppleScriptString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function buildMacWordCommand(inputPath: string, outputPath: string): WordCommand {
  const script = [
    'tell application "Microsoft Word"',
    `set sourceFile to POSIX file "${escapeAppleScriptString(inputPath)}"`,
    `set targetFile to POSIX file "${escapeAppleScriptString(outputPath)}"`,
    'set documentRef to open sourceFile',
    'save as documentRef file name targetFile file format format PDF',
    'close documentRef saving no',
    'end tell'
  ].join('\n')

  return {
    file: 'osascript',
    args: ['-e', script]
  }
}
