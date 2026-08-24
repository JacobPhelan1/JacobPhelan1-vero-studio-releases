function Card({ name, status, detail, children }) { return <article className="connection-card"><header><div><p>{name}</p><h3>{detail}</h3></div><span className={status === "Connected" ? "ok" : "pending"}>{status}</span></header>{children}</article>; }
const value = (input) => input || "—";
export default function ConnectionsPage({ controller }) {
  const { gfx, localBridge } = controller;
  const packages = [...new Set(gfx.graphics.map((graphic) => graphic.packageId).filter(Boolean))];
  const vmixStatus = gfx.output?.vmix || "Disconnected";
  return <section className="panel-page"><header><div><p>SYSTEM HEALTH</p><h2>Connections</h2></div><button onClick={controller.refresh}>REFRESH ALL</button></header><div className="connections">
    <Card name="VERO STUDIO ENGINE" status={controller.bridge.status} detail={controller.settings.studioEngineUrl}><dl><div><dt>APPLICATION</dt><dd>{controller.bridge.applicationId || "vero.studio"}</dd></div><div><dt>VERSION</dt><dd>{value(controller.bridge.applicationVersion)}</dd></div><div><dt>PROTOCOL</dt><dd>{controller.bridge.protocolVersion ? `V${controller.bridge.protocolVersion}` : "—"}</dd></div></dl></Card>
    <Card name="VERO GFX" status={gfx.status} detail={controller.settings.gfxProtocolUrl}><dl><div><dt>APPLICATION</dt><dd>{value(gfx.applicationId)}</dd></div><div><dt>GFX VERSION</dt><dd>{value(gfx.version)}</dd></div><div><dt>PROTOCOL</dt><dd>{gfx.protocolVersion ? `V${gfx.protocolVersion}` : "—"}</dd></div><div><dt>PRODUCTION</dt><dd>{gfx.activeProductionName || gfx.activeProductionId || "None"}</dd></div><div><dt>GRAPHICS PACKAGE</dt><dd>{packages.join(", ") || "None reported"}</dd></div></dl><p>{gfx.status === "Connected" ? "Direct application connection established." : gfx.error || "Studio reconnects automatically when the dedicated GFX service becomes available."}</p></Card>
    <Card name="VERO LOCAL BRIDGE" status={localBridge.status} detail={controller.settings.localBridgeUrl}><dl><div><dt>SERVICE</dt><dd>{localBridge.service || "VERO Local Bridge"}</dd></div><div><dt>VERSION</dt><dd>{value(localBridge.version)}</dd></div></dl><p>{localBridge.error || "Local-machine and vMix transport is independent from the Studio ↔ GFX connection."}</p></Card>
    <Card name="vMIX" status={vmixStatus} detail="Graphics output"><dl><div><dt>THROUGH</dt><dd>VERO Local Bridge</dd></div><div><dt>GFX EXECUTION</dt><dd>{gfx.status === "Connected" && vmixStatus === "Connected" ? "Available" : "Unavailable"}</dd></div></dl><p>vMix availability does not determine whether Studio and GFX can exchange application state.</p></Card>
    <Card name="VERO REPLAY" status="Coming Soon" detail="Not connected"/><Card name="VERO AUDIO" status="Coming Soon" detail="Not connected"/>
  </div></section>;
}
