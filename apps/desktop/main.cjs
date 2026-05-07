const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { startServer } = require('../server');

const PORT = Number(process.env.PORT || 3001);
const DEV_RENDERER_URL = process.env.ELECTRON_RENDERER_URL || 'http://localhost:8080';
const PROD_RENDERER_URL = `http://127.0.0.1:${PORT}`;

let server;
let mainWindow;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#0b1020',
    title: 'Wandr',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function loadRenderer(window, url) {
  for (;;) {
    try {
      await window.loadURL(url);
      return;
    } catch (error) {
      if (app.isPackaged) {
        throw error;
      }
      await delay(750);
    }
  }
}

async function startApplication() {
  const webDir = app.isPackaged ? path.resolve(app.getAppPath(), 'dist') : undefined;
  server = startServer({ port: PORT, webDir });

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const window = createWindow();
  const rendererUrl = app.isPackaged ? PROD_RENDERER_URL : DEV_RENDERER_URL;
  await loadRenderer(window, rendererUrl);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'detach' });
  }
}

async function reopenWindow() {
  const window = createWindow();
  const rendererUrl = app.isPackaged ? PROD_RENDERER_URL : DEV_RENDERER_URL;
  await loadRenderer(window, rendererUrl);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'detach' });
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.whenReady().then(async () => {
  await startApplication();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      reopenWindow().catch((error) => {
        console.error('Failed to recreate the app window:', error);
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
    server = undefined;
  }
});
