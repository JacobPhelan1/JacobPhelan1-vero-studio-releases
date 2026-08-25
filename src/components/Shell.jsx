import { useState } from "react";
import ProductionWorkspace from "./workspace/ProductionWorkspace";
import InputsPage from "./workspace/InputsPage";
import AudioPage from "./workspace/AudioPage";
import GraphicsPage from "./workspace/GraphicsPage";
import SettingsPage from "./workspace/SettingsPage";
import StreamingPage from "./workspace/StreamingPage";

const nav = ["Production", "Inputs", "Graphics", "Audio", "Streaming", "Settings"];
export default function Shell({ production, onProductionChange, onClose, controller, updater }) {
  const [page, setPage] = useState("Production");
  const views = { Production: <ProductionWorkspace production={production} onProductionChange={onProductionChange} controller={controller} />, Inputs: <InputsPage production={production} onProductionChange={onProductionChange} />, Graphics: <GraphicsPage production={production} controller={controller} />, Audio: <AudioPage production={production} onProductionChange={onProductionChange} />, Streaming: <StreamingPage production={production} onProductionChange={onProductionChange} />, Settings: <SettingsPage production={production} onProductionChange={onProductionChange} controller={controller} updater={updater} /> };
  return <div className="app-shell">
    <aside>
      <header><img src="/brand/studio/IconWordmarkStudio.png" alt="VERO Studio" /></header>
      <nav>{nav.map((item) => <button className={page === item ? "active" : ""} key={item} onClick={() => setPage(item)}><i />{item}</button>)}</nav>
      <footer><div className={`status-dot ${controller.localBridge.status.toLowerCase()}`} /><span><strong>LOCAL BRIDGE</strong><small>{controller.localBridge.status}</small></span><button title="Close production" onClick={onClose}>⌂</button></footer>
    </aside>
    <main className="main">
      <header className="topbar"><div><p>{page.toUpperCase()}</p><h1>{production.productionName}</h1></div><div className="health"><span className={controller.bridge.status === "Connected" ? "ok" : "bad"}>STUDIO {controller.bridge.status.toUpperCase()}</span><span className={controller.gfx.status === "Connected" ? (controller.gfx.output?.vmix === "Connected" ? "ok" : "warn") : "bad"}>GFX {controller.gfx.status === "Connected" && controller.gfx.output?.vmix !== "Connected" ? "CONNECTED · OUTPUT OFFLINE" : controller.gfx.status.toUpperCase()}</span></div></header>
      {controller.alerts.length > 0 && <div className="alerts">{controller.alerts.map((alert) => <button key={alert.id} className={alert.severity} onClick={() => controller.dismissAlert(alert.id)}>⚠ {alert.message}<b>×</b></button>)}</div>}
      <div className="page">{views[page]}</div>
    </main>
  </div>;
}
