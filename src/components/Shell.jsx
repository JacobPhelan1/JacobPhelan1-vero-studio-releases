import { useState } from "react";
import ProductionWorkspace from "./workspace/ProductionWorkspace";
import InputsPage from "./workspace/InputsPage";
import AudioPage from "./workspace/AudioPage";
import ConnectionsPage from "./workspace/ConnectionsPage";
import GraphicsPage from "./workspace/GraphicsPage";
import SettingsPage from "./workspace/SettingsPage";

const nav = ["Production", "Inputs", "Graphics", "Audio", "Connections", "Settings"];
export default function Shell({ production, onProductionChange, onClose, controller, updater }) {
  const [page, setPage] = useState("Production");
  const views = { Production: <ProductionWorkspace production={production} controller={controller} />, Inputs: <InputsPage production={production} onProductionChange={onProductionChange} controller={controller} />, Graphics: <GraphicsPage />, Audio: <AudioPage controller={controller} />, Connections: <ConnectionsPage controller={controller} />, Settings: <SettingsPage production={production} onProductionChange={onProductionChange} controller={controller} updater={updater} /> };
  return <div className="app-shell">
    <aside>
      <header><img src="/brand/studio/IconWordmarkStudio.png" alt="VERO Studio" /></header>
      <nav>{nav.map((item) => <button className={page === item ? "active" : ""} key={item} onClick={() => setPage(item)}><i />{item}</button>)}</nav>
      <footer><div className={`status-dot ${controller.bridge.status.toLowerCase()}`} /><span><strong>LOCAL BRIDGE</strong><small>{controller.bridge.status}</small></span><button title="Close production" onClick={onClose}>⌂</button></footer>
    </aside>
    <main className="main">
      <header className="topbar"><div><p>{page.toUpperCase()}</p><h1>{production.productionName}</h1></div><div className="health"><span className={controller.bridge.status === "Connected" ? "ok" : "bad"}>BRIDGE {controller.bridge.status.toUpperCase()}</span>{controller.settings.vmix.enabled&&<span className={controller.vmix.status === "Connected" ? "ok" : "bad"}>VMIX {controller.vmix.status.toUpperCase()}</span>}</div></header>
      {controller.alerts.length > 0 && <div className="alerts">{controller.alerts.map((alert) => <button key={alert.id} className={alert.severity} onClick={() => controller.dismissAlert(alert.id)}>⚠ {alert.message}<b>×</b></button>)}</div>}
      <div className="page">{views[page]}</div>
    </main>
  </div>;
}
