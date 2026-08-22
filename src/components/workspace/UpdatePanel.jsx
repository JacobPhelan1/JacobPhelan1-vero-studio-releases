import { useEffect, useState } from "react";

const INITIAL = { status: "idle", detail: "Installed builds check automatically at startup and every six hours." };

export default function UpdatePanel() {
  const [update, setUpdate] = useState(INITIAL);
  const desktop = window.veroDesktop;

  useEffect(() => desktop?.onUpdateStatus?.((next) => setUpdate(next)), [desktop]);

  async function check() {
    if (!desktop?.checkForUpdates) { setUpdate({ status: "development", detail: "Update checks are available in the installed desktop application." }); return; }
    setUpdate({ status: "checking", detail: "Checking the VERO Studio release channel…" });
    const result = await desktop.checkForUpdates();
    if (!result?.ok) setUpdate({ status: result?.status || "error", detail: result?.reason || "The update service is currently unavailable." });
  }

  async function install() {
    const result = await desktop?.installUpdate?.();
    if (!result?.ok) setUpdate({ status: "error", detail: result?.reason || "No update is ready to install." });
  }

  const label = { idle: "READY", checking: "CHECKING", downloading: "DOWNLOADING", ready: "UPDATE READY", current: "UP TO DATE", error: "UNAVAILABLE", development: "DESKTOP ONLY" }[update.status] || "UPDATE";
  return <article className={`update-panel update-${update.status}`}>
    <div className="update-heading"><div><h3>Updates</h3><p>VERO Studio {desktop?.appVersion || "development"}</p></div><span>{label}</span></div>
    <p>{update.detail}</p>
    {update.status === "ready" ? <button className="primary" onClick={install}>RESTART AND INSTALL</button> : <button disabled={["checking", "downloading"].includes(update.status)} onClick={check}>{update.status === "checking" ? "CHECKING…" : "CHECK FOR UPDATES"}</button>}
  </article>;
}
