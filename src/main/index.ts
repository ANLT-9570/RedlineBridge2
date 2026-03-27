import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { registerCompareIpc } from './ipc/registerCompareIpc'
import { registerDialogIpc } from './ipc/registerDialogIpc'

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs')
    }
  })

  window.webContents.on('console-message', (_event, _level, message) => {
    console.log('[renderer-console]', message)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    return
  }

  window.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  registerDialogIpc()
  registerCompareIpc()
  createWindow()
})
