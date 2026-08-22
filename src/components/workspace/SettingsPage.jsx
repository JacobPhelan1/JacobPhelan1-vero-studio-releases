import { useState } from "react";
import UpdatePanel from "./UpdatePanel";

export default function SettingsPage({ production, onProductionChange, controller, updater }) {
  const [draft, setDraft] = useState(controller.settings);
  const updateProduction = (field, value) => onProductionChange({ ...production, [field]: value });
  return <section className="panel-page settings">
    <header><p>APPLICATION</p><h2>Settings</h2><span>Functional configuration only</span></header>
    <article>
      <h3>Production</h3>
      <label>PRODUCTION NAME<input value={production.productionName} onChange={(event) => updateProduction("productionName", event.target.value)} /></label>
      <label>EVENT NAME<input value={production.eventName} onChange={(event) => updateProduction("eventName", event.target.value)} /></label>
      <div><label>SPORT<input value={production.sport} onChange={(event) => updateProduction("sport", event.target.value)} /></label><label>VENUE<input value={production.venue} onChange={(event) => updateProduction("venue", event.target.value)} /></label></div>
    </article>
    <article>
      <h3>Connections</h3>
      <label>STUDIO BRIDGE URL<input value={draft.bridgeUrl} onChange={(event) => setDraft({ ...draft, bridgeUrl: event.target.value })} /></label>
      <label>VERO GFX BRIDGE URL<input value={draft.gfxBridgeUrl} onChange={(event) => setDraft({ ...draft, gfxBridgeUrl: event.target.value })} /></label>
      <button className="primary" onClick={() => controller.saveSettings(draft)}>SAVE CONNECTIONS</button>
    </article>
    <article><h3>Account</h3><p>No VERO Account backend is configured. Studio does not create a fake identity or store passwords.</p></article>
    <UpdatePanel updater={updater} />
  </section>;
}
