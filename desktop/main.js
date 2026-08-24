import { app, BrowserWindow, dialog, ipcMain, Menu, session, shell } from "electron";
import updater from "electron-updater";
import http from "node:http";
import { createReadStream } from "node:fs";
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStudioBridge } from "./studioBridge.js";

const HOST = "127.0.0.1", PORT = 43120, ORIGIN = `http://${HOST}:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), DIST = path.join(ROOT, "dist"), UPDATE_INTERVAL = 6 * 60 * 60 * 1000;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".mov": "video/quicktime", ".mkv": "video/x-matroska", ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".flac": "audio/flac" };
let server, mainWindow, updateTimer, downloadedUpdate, activeUpdateCheck;
let updateState = { status: "initializing", detail: "Starting VERO Studio…", version: "" };

function writeUpdateLog(level, ...values) {
  const line = `${new Date().toISOString()} [${level}] ${values.map((value) => value instanceof Error ? `${value.message}\n${value.stack || ""}` : typeof value === "string" ? value : JSON.stringify(value)).join(" ")}\n`;
  const directory = app.getPath("logs");
  void mkdir(directory, { recursive: true }).then(() => appendFile(path.join(directory, "updater.log"), line)).catch(() => {});
}

async function serve(request, response) {
  const url = new URL(request.url, ORIGIN); let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (url.pathname === "/__vero/media/local") { const filename=url.searchParams.get("path");if(!filename||!path.isAbsolute(filename)){response.statusCode=400;response.end("Invalid media path.");return;}try{const info=await stat(filename);if(!info.isFile())throw new Error("Not a file");const range=request.headers.range;response.setHeader("Accept-Ranges","bytes");response.setHeader("Content-Type",mime[path.extname(filename).toLowerCase()]||"application/octet-stream");if(range){const match=/bytes=(\d*)-(\d*)/.exec(range),start=Number(match?.[1]||0),end=Math.min(Number(match?.[2]||info.size-1),info.size-1);if(start>end||start>=info.size){response.statusCode=416;response.setHeader("Content-Range",`bytes */${info.size}`);response.end();return;}response.statusCode=206;response.setHeader("Content-Range",`bytes ${start}-${end}/${info.size}`);response.setHeader("Content-Length",end-start+1);createReadStream(filename,{start,end}).pipe(response);}else{response.setHeader("Content-Length",info.size);createReadStream(filename).pipe(response);}return;}catch{response.statusCode=404;response.end("Media file unavailable.");return;} }
  if (!relative || !path.extname(relative)) relative = "index.html";
  let filename = path.resolve(DIST, relative);
  if (path.relative(DIST, filename).startsWith("..")) { response.statusCode = 403; response.end(); return; }
  try { if (!(await stat(filename)).isFile()) throw new Error("Not a file"); } catch { filename = path.join(DIST, "index.html"); }
  response.setHeader("Content-Type", mime[path.extname(filename)] || "application/octet-stream"); response.end(await readFile(filename));
}

function startServer() { const bridge = createStudioBridge({ studioUrl: ORIGIN, applicationVersion: app.getVersion() }); server = http.createServer((request, response) => bridge(request, response, () => serve(request, response))); return new Promise((resolve, reject) => { server.once("error", reject); server.listen(PORT, HOST, resolve); }); }
function isStudioOrigin(value) { try { return new URL(value).origin === ORIGIN; } catch { return false; } }
function safeUpdateError(error) {
  const message = String(error?.message || error || "");
  if (/404|releases\.atom|authentication token/i.test(message)) return "The VERO Studio update channel is not available yet. The application can continue normally.";
  if (/ENOTFOUND|ECONN|network|internet|timeout/i.test(message)) return "VERO Studio could not reach the update service. Check your internet connection and try again.";
  return "VERO Studio could not check for updates right now. Please try again later.";
}
function sendUpdateStatus(status, detail = "") { updateState = { status, detail, version: downloadedUpdate?.version || "" }; if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("updates:status", updateState); }
function configureUpdater() {
  const { autoUpdater } = updater;
  autoUpdater.logger = { info: (...values) => writeUpdateLog("INFO", ...values), warn: (...values) => writeUpdateLog("WARN", ...values), error: (...values) => writeUpdateLog("ERROR", ...values), debug: (...values) => writeUpdateLog("DEBUG", ...values) };
  autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true; autoUpdater.autoRunAppAfterInstall = true;
  writeUpdateLog("INFO", `Updater initialized for VERO Studio ${app.getVersion()} as a per-user installation.`);
  autoUpdater.on("checking-for-update", () => sendUpdateStatus("checking"));
  autoUpdater.on("update-available", (info) => sendUpdateStatus("downloading", `VERO Studio ${info.version}`));
  autoUpdater.on("update-not-available", () => sendUpdateStatus("current", `VERO Studio ${app.getVersion()} is current.`));
  autoUpdater.on("download-progress", (progress) => sendUpdateStatus("downloading", `${Math.round(progress.percent)}%`));
  autoUpdater.on("update-downloaded", (info) => { downloadedUpdate = info; sendUpdateStatus("ready", `VERO Studio ${info.version} will apply automatically when Studio closes.`); });
  autoUpdater.on("error", (error) => sendUpdateStatus("error", safeUpdateError(error)));
}
async function checkForUpdates() { if (!app.isPackaged) return { ok: false, status: "development", reason: "Update checks are available in installed builds." };if(activeUpdateCheck)return activeUpdateCheck;activeUpdateCheck=(async()=>{try{sendUpdateStatus("checking","Checking the VERO Studio release channel…");await updater.autoUpdater.checkForUpdates();return{ok:updateState.status!=="error",...updateState};}catch(error){const reason=safeUpdateError(error);sendUpdateStatus("error",reason);return{ok:false,status:"error",detail:reason,reason};}finally{activeUpdateCheck=null;}})();return activeUpdateCheck;}
function createWindow() {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => permission === "media" && isStudioOrigin(requestingOrigin));
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => callback(permission === "media" && isStudioOrigin(details.requestingUrl)));
  mainWindow = new BrowserWindow({ width: 1600, height: 1000, minWidth: 1080, minHeight: 700, backgroundColor: "#070b0f", title: "VERO Studio", autoHideMenuBar: true, icon: path.join(ROOT, "public", "brand", "studio", "IconStudio.png"), webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(ROOT, "desktop", "preload.cjs"), additionalArguments: [`--vero-app-version=${app.getVersion()}`] } });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); return { action: "deny" }; });
  mainWindow.loadURL(ORIGIN); mainWindow.webContents.once("did-finish-load", () => { setTimeout(checkForUpdates, 8000); clearInterval(updateTimer); updateTimer = setInterval(checkForUpdates, UPDATE_INTERVAL); });
}

ipcMain.handle("updates:check", checkForUpdates);
ipcMain.handle("updates:status", () => updateState);
ipcMain.handle("updates:install", () => { if (!downloadedUpdate) return { ok: false, reason: "No update is ready." }; writeUpdateLog("INFO", `Applying VERO Studio ${downloadedUpdate.version || "update"} and restarting.`); updater.autoUpdater.quitAndInstall(true, true); return { ok: true }; });
ipcMain.handle("media:choose", async (_event, kind) => { const filters=kind==="image"?[{name:"Images",extensions:["png","jpg","jpeg","gif","webp","bmp"]}]:kind==="audio"?[{name:"Audio",extensions:["mp3","wav","m4a","flac","aac"]}]:[{name:"Video",extensions:["mp4","mov","mkv","webm","avi","m4v"]}];const result=await dialog.showOpenDialog(mainWindow,{title:`Select ${kind||"media"} input`,properties:["openFile"],filters});if(result.canceled||!result.filePaths[0])return{ok:false,canceled:true};const selected=result.filePaths[0];return{ok:true,path:selected,name:path.basename(selected)};});
if (!app.requestSingleInstanceLock()) app.quit(); else app.whenReady().then(async () => { await startServer(); configureUpdater(); Menu.setApplicationMenu(null); createWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { clearInterval(updateTimer); server?.close(); });
