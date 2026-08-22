const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("veroDesktop", {
  bridgeUrl: "http://127.0.0.1:43120",
  appVersion: process.env.npm_package_version || "0.1.0",
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  installUpdate: () => ipcRenderer.invoke("updates:install"),
  onUpdateStatus: (listener) => {
    const handler = (_event, value) => listener(value);
    ipcRenderer.on("updates:status", handler);
    return () => ipcRenderer.removeListener("updates:status", handler);
  },
});
