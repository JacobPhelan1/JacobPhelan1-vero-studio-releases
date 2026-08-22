const LABELS = { initializing: "STARTING", idle: "READY", checking: "CHECKING", downloading: "DOWNLOADING", ready: "UPDATE READY", current: "UP TO DATE", error: "UNAVAILABLE", development: "DESKTOP ONLY" };

export default function UpdatePanel({ updater }) {
  const { update } = updater;
  return <article className={`update-panel update-${update.status}`}>
    <div className="update-heading"><div><h3>Updates</h3><p>VERO Studio {updater.appVersion}</p></div><span>{LABELS[update.status] || "UPDATE"}</span></div>
    <p>{update.detail}</p>
    {update.status === "ready" ? <button className="primary" onClick={updater.install}>RESTART TO UPDATE</button> : <button disabled={["initializing", "checking", "downloading"].includes(update.status)} onClick={updater.check}>{update.status === "checking" ? "CHECKING…" : "CHECK FOR UPDATES"}</button>}
  </article>;
}
