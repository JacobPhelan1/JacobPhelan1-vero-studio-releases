const { contextBridge, ipcRenderer } = require("electron");
const appVersionArgument = process.argv.find((value) => value.startsWith("--vero-app-version="));
contextBridge.exposeInMainWorld("veroDesktop", {
  studioEngineUrl: "http://127.0.0.1:43120",
  appVersion: appVersionArgument?.slice("--vero-app-version=".length) || "0.1.0",
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  getUpdateStatus: () => ipcRenderer.invoke("updates:status"),
  installUpdate: () => ipcRenderer.invoke("updates:install"),
  chooseMediaFile: (kind) => ipcRenderer.invoke("media:choose", kind),
  onUpdateStatus: (listener) => {
    const handler = (_event, value) => listener(value);
    ipcRenderer.on("updates:status", handler);
    return () => ipcRenderer.removeListener("updates:status", handler);
  },
});
