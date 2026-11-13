// Electron shell for "The Last Way Out" (Ubuntu / Linux desktop).
// Serves the Vite build from a privileged app:// scheme so ES modules, dynamic imports and WebAudio work without file:// restrictions.
const { app, BrowserWindow, protocol, net, ipcMain, Menu } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')

const dist = path.join(__dirname, '..', 'dist')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('enable-gpu-rasterization')
// Ubuntu 23.10+ restricts unprivileged user namespaces; AppImage/dev runs need this
app.commandLine.appendSwitch('no-sandbox')

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 800, minHeight: 500, backgroundColor: '#000000',
    title: 'The Last Way Out', autoHideMenuBar: true, fullscreenable: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  })
  Menu.setApplicationMenu(null)
  win.loadURL('app://game/index.html')
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault() }
    if (input.key === 'F12' && input.control) win.webContents.toggleDevTools()
  })
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const u = new URL(req.url)
    let p = decodeURIComponent(u.pathname)
    if (p === '/' || p === '') p = '/index.html'
    const file = path.normalize(path.join(dist, p))
    if (!file.startsWith(dist)) return new Response('forbidden', { status: 403 })
    return net.fetch(pathToFileURL(file).toString())
  })
  ipcMain.on('quit', () => app.quit())
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => app.quit())
