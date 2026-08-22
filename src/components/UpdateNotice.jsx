import { useState } from "react";

export default function UpdateNotice({ updater }) {
  const [dismissedVersion, setDismissedVersion] = useState("");
  const { update } = updater;
  if (update.status !== "ready" || dismissedVersion === update.version) return null;
  return <section className="update-notice" role="status">
    <img src="/brand/studio/IconStudio.png" alt="" />
    <div><span>VERO STUDIO UPDATE</span><strong>{update.version ? `Version ${update.version} is ready` : "An update is ready"}</strong><p>Your production data and settings will be preserved. Restart when it is safe to leave the current production.</p></div>
    <button onClick={() => setDismissedVersion(update.version || "ready")}>LATER</button>
    <button className="primary" onClick={updater.install}>RESTART &amp; INSTALL</button>
  </section>;
}
