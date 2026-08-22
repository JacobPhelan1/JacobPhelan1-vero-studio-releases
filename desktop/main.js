import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import updater from "electron-updater";
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createVmixProxy } from "./bridge.js";

const HOST = "127.0.0.1", PORT = 43120, ORIGIN = `http://${HOST}:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), DIST = path.join(ROOT, "dist"), UPDATE_INTERVAL = 6 * 60 * 60 * 1000;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };
let server, mainWindow, updateTimer, downloadedUpdate;

async function serve(request, response) {
  const url = new URL(request.url, ORIGIN); let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!relative || !path.extname(relative)) relative = "index.html";
  let filename = path.resolve(DIST, relative);
  if (path.relative(DIST, filename).startsWith("..")) { response.statusCode = 403; response.end(); return; }
  try { if (!(await stat(filename)).isFile()) throw new Error("Not a file"); } catch { filename = path.join(DIST, "index.html"); }
  response.setHeader("Content-Type", mime[path.extname(filename)] || "application/octet-stream"); response.end(await readFile(filename));
}

function startServer() { const bridge = createVmixProxy({ bridgeUrl: ORIGIN }); server = http.createServer((request, response) => bridge(request, response, () => serve(request, response))); return new Promise((resolve, reject) => { server.once("error", reject); server.listen(PORT, HOST, resolve); }); }
function safeUpdateError(error) {
  const message = String(error?.message || error || "");
  if (/404|releases\.atom|authentication token/i.test(message)) return "The VERO Studio update channel is not available yet. The application can continue normally.";
  if (/ENOTFOUND|ECONN|network|internet|timeout/i.test(message)) return "VERO Studio could not reach the update service. Check your internet connection and try again.";
  return "VERO Studio could not check for updates right now. Please try again later.";
}
function sendUpdateStatus(status, detail = "") { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("updates:status", { status, detail, version: downloadedUpdate?.version || "" }); }
function configureUpdater() {
  const { autoUpdater } = updater; autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("checking-for-update", () => sendUpdateStatus("checking"));
  autoUpdater.on("update-available", (info) => sendUpdateStatus("downloading", `VERO Studio ${info.version}`));
  autoUpdater.on("update-not-available", () => sendUpdateStatus("current", `VERO Studio ${app.getVersion()} is current.`));
  autoUpdater.on("download-progress", (progress) => sendUpdateStatus("downloading", `${Math.round(progress.percent)}%`));
  autoUpdater.on("update-downloaded", (info) => { downloadedUpdate = info; sendUpdateStatus("ready", `VERO Studio ${info.version} is ready to install.`); });
  autoUpdater.on("error", (error) => sendUpdateStatus("error", safeUpdateError(error)));
}
async function checkForUpdates() { if (!app.isPackaged) return { ok: false, status: "development", reason: "Update checks are available in installed builds." }; try { await updater.autoUpdater.checkForUpdates(); return { ok: true, status: "checking" }; } catch (error) { const reason = safeUpdateError(error); sendUpdateStatus("error", reason); return { ok: false, status: "error", reason }; } }
function createWindow() {
  mainWindow = new BrowserWindow({ width: 1600, height: 1000, minWidth: 1080, minHeight: 700, backgroundColor: "#070b0f", title: "VERO Studio", autoHideMenuBar: true, icon: path.join(ROOT, "public", "brand", "studio", "IconStudio.png"), webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(ROOT, "desktop", "preload.cjs"), additionalArguments: [`--vero-app-version=${app.getVersion()}`] } });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); return { action: "deny" }; });
  mainWindow.loadURL(ORIGIN); mainWindow.webContents.once("did-finish-load", () => { setTimeout(checkForUpdates, 8000); clearInterval(updateTimer); updateTimer = setInterval(checkForUpdates, UPDATE_INTERVAL); });
}

ipcMain.handle("updates:check", checkForUpdates);
ipcMain.handle("updates:install", () => { if (!downloadedUpdate) return { ok: false, reason: "No update is ready." }; updater.autoUpdater.quitAndInstall(false, true); return { ok: true }; });
if (!app.requestSingleInstanceLock()) app.quit(); else app.whenReady().then(async () => { await startServer(); configureUpdater(); Menu.setApplicationMenu(null); createWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { clearInterval(updateTimer); server?.close(); });
