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
