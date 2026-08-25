import { useState } from "react";
import UpdatePanel from "./UpdatePanel";
import ConnectionsPage from "./ConnectionsPage";

export default function SettingsPage({ production, onProductionChange, controller, updater }) {
  const [draft, setDraft] = useState(controller.settings);
  const updateProduction = (field, value) => onProductionChange({ ...production, [field]: value });
  const interfaceMode = production.settings?.interfaceMode || "simple";
  const updateInterfaceMode = (value) => onProductionChange({ ...production, settings: { ...production.settings, interfaceMode: value } });
  return <section className="panel-page settings settings-accordion">
    <header><p>APPLICATION</p><h2>Settings</h2><span>Functional configuration only</span></header>
    <details open><summary><span>Production</span><small>Name, event, and venue</small></summary><article>
      <label>PRODUCTION NAME<input value={production.productionName} onChange={(event) => updateProduction("productionName", event.target.value)} /></label>
      <label>EVENT NAME<input value={production.eventName} onChange={(event) => updateProduction("eventName", event.target.value)} /></label>
      <div><label>SPORT<input value={production.sport} onChange={(event) => updateProduction("sport", event.target.value)} /></label><label>VENUE<input value={production.venue} onChange={(event) => updateProduction("venue", event.target.value)} /></label></div>
    </article></details>
    <details><summary><span>Interface</span><small>Simple by default, advanced when needed</small></summary><article><label>CONTROL DEPTH<select value={interfaceMode} onChange={(event) => updateInterfaceMode(event.target.value)}><option value="simple">Simple</option><option value="advanced">Advanced</option></select></label><p>Advanced input controls stay tucked inside expandable sections in either mode. Future expert settings will appear here without crowding the primary workflow.</p></article></details>
    <details><summary><span>Connections</span><small>Studio, GFX, Local Bridge, and service health</small></summary><article>
      <label>STUDIO ENGINE URL<input value={draft.studioEngineUrl} onChange={(event) => setDraft({ ...draft, studioEngineUrl: event.target.value })} /></label>
      <label>VERO GFX PROTOCOL URL<input value={draft.gfxProtocolUrl} onChange={(event) => setDraft({ ...draft, gfxProtocolUrl: event.target.value })} /></label>
      <label>VERO LOCAL BRIDGE URL<input value={draft.localBridgeUrl} onChange={(event) => setDraft({ ...draft, localBridgeUrl: event.target.value })} /></label>
      <button className="primary" onClick={() => controller.saveSettings(draft)}>SAVE CONNECTIONS</button>
      <ConnectionsPage controller={controller} embedded />
    </article></details>
    <details><summary><span>Account</span><small>VERO workspace and plan</small></summary><article><p>No VERO Account backend is configured. Studio does not create a fake identity or store passwords.</p></article></details>
    <details><summary><span>Updates</span><small>Application version and release channel</small></summary><UpdatePanel updater={updater} /></details>
  </section>;
}
