import { dialog, ipcMain } from 'electron'

const PICK_FILE_CHANNEL = 'dialog:pick-file'

export function registerDialogIpc() {
  ipcMain.handle(PICK_FILE_CHANNEL, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Supported documents', extensions: ['pdf', 'docx'] }
      ]
    })

    if (result.canceled) {
      return null
    }

    return result.filePaths[0] ?? null
  })
}
