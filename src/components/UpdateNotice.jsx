import { useState } from "react";

export default function UpdateNotice({ updater }) {
  const [dismissedVersion, setDismissedVersion] = useState("");
  const { update } = updater;
  if (update.status !== "ready" || dismissedVersion === update.version) return null;
  return <section className="update-notice" role="status">
    <img src="/brand/studio/IconStudio.png" alt="" />
    <div><span>VERO STUDIO UPDATE</span><strong>{update.version ? `Version ${update.version} is ready` : "An update is ready"}</strong><p>It will apply silently when Studio closes. Your productions and settings will be preserved.</p></div>
    <button onClick={() => setDismissedVersion(update.version || "ready")}>LATER</button>
    <button className="primary" onClick={updater.install}>RESTART TO UPDATE</button>
  </section>;
}
