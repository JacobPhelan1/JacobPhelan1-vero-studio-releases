import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_CONFIG } from "../config/appConfig";
import { BridgeClient, LocalBridgeClient } from "../integrations/bridge/bridgeClient";
import { GFX_CONNECTION_STATES, GfxProtocolError, gfxService } from "../integrations/gfx/gfxService";
import { productionStore } from "../persistence/productionStore";

const initialGfx = { status: "Discovering", error: "", protocolEndpointConnected: false, capabilities: [], graphics: [], output: {} };
const productionContext = (production) => ({ productionId: production.productionId, eventId: production.eventId || "", workspaceId: production.workspaceId || "", accountId: production.accountId || "", organizationId: production.organizationId || "", sport: production.sport || "", homeTeamId: production.homeTeamId || "", awayTeamId: production.awayTeamId || "", graphicsPackageId: production.graphicsPackageId || "", productionName: production.productionName || "", venue: production.venue || "", date: production.date || "", active: true });
function connectionFailure(error) { if (error instanceof GfxProtocolError && error.code === "VERSION_INCOMPATIBLE") return { status: GFX_CONNECTION_STATES.INCOMPATIBLE, error: error.message, protocolVersion: error.protocolVersion }; if (error instanceof GfxProtocolError && error.code === "GFX_NOT_RUNNING") return { status: GFX_CONNECTION_STATES.NOT_CONNECTED, error: error.message }; if (error instanceof GfxProtocolError && error.code === "GFX_PROTOCOL_UNAVAILABLE") return { status: GFX_CONNECTION_STATES.ENDPOINT_UNAVAILABLE, error: error.message }; return { status: GFX_CONNECTION_STATES.ERROR, error: error.message }; }

export function useStudioController() {
  const saved = productionStore.settings();
  const savedGfxUrl = saved.gfxProtocolUrl || saved.gfxBridgeUrl || "";
  const migratedGfxUrl = savedGfxUrl && !/:43110\/?$/.test(savedGfxUrl) ? savedGfxUrl : APP_CONFIG.services.gfxProtocolUrl;
  const [settings, setSettings] = useState({ studioEngineUrl: saved.studioEngineUrl || saved.bridgeUrl || window.veroDesktop?.studioEngineUrl || APP_CONFIG.services.studioEngineUrl, gfxProtocolUrl: migratedGfxUrl, localBridgeUrl: saved.localBridgeUrl || APP_CONFIG.services.localBridgeUrl });
  const [bridge, setBridge] = useState({ status: "Checking", error: "" });
  const [localBridge, setLocalBridge] = useState({ status: "Checking", error: "" });
  const [gfx, setGfx] = useState(initialGfx);
  const [gfxCommands, setGfxCommands] = useState({});
  const [alerts, setAlerts] = useState([]);
  const activeContext = useRef(null);
  const bridgeClient = useMemo(() => new BridgeClient(settings.studioEngineUrl), [settings.studioEngineUrl]);
  const localBridgeClient = useMemo(() => new LocalBridgeClient(settings.localBridgeUrl), [settings.localBridgeUrl]);
  const addAlert = useCallback((message, severity = "warning") => setAlerts((items) => [{ id: crypto.randomUUID(), message, severity }, ...items].slice(0, 8)), []);
  const refreshGfx = useCallback(async () => {
    gfxService.setBaseUrl(settings.gfxProtocolUrl);
    try {
      const snapshot = await gfxService.connect({ accountId: activeContext.current?.accountId, workspaceId: activeContext.current?.workspaceId });
      setGfx((current) => ({ ...current, error: "", ...snapshot }));
      if (snapshot.status === GFX_CONNECTION_STATES.CONNECTED && activeContext.current && snapshot.activeProductionId !== activeContext.current.productionId) { try { await gfxService.sendProductionContext(activeContext.current); } catch (error) { addAlert(`VERO GFX rejected the production context: ${error.message}`); } }
      return snapshot;
    } catch (error) { console.warn(`[VERO Studio Protocol] ${error.message}`); const failure = connectionFailure(error); setGfx({ ...initialGfx, ...failure }); return failure; }
  }, [addAlert, settings.gfxProtocolUrl]);
  const refresh = useCallback(async () => { try { setBridge({ status: "Connected", error: "", ...(await bridgeClient.health()) }); } catch (error) { setBridge({ status: "Disconnected", error: error.message }); } try { setLocalBridge({ status: "Connected", error: "", ...(await localBridgeClient.health()) }); } catch (error) { setLocalBridge({ status: "Disconnected", error: error.message }); } return refreshGfx(); }, [bridgeClient, localBridgeClient, refreshGfx]);
  useEffect(() => {
    const initialRefresh = setTimeout(refresh, 0);
    const heartbeat = setInterval(refresh, APP_CONFIG.discoveryIntervalMs);
    const eventPoll = setInterval(async () => { try { const events = await gfxService.events(); if (!events.length) return; const layers = events.filter((event) => event.type === "GFX_STATE_CHANGED").at(-1)?.payload?.layers; setGfx((current) => ({ ...current, lastEventAt: new Date().toISOString(), graphics: layers ? current.graphics.map((graphic) => ({ ...graphic, active: Object.values(layers).includes(graphic.graphicId) })) : current.graphics })); await refreshGfx(); } catch (error) { if (error.code === "GFX_NOT_RUNNING") setGfx({ ...initialGfx, status: GFX_CONNECTION_STATES.NOT_CONNECTED, error: error.message }); } }, APP_CONFIG.gfxEventIntervalMs);
    return () => { clearTimeout(initialRefresh); clearInterval(heartbeat); clearInterval(eventPoll); gfxService.disconnect(); };
  }, [refresh, refreshGfx]);
  const saveSettings = useCallback((next) => { setSettings(next); productionStore.saveSettings(next); }, []);
  const publishProduction = useCallback(async (production) => {
    const context = productionContext(production); activeContext.current = context;
    try { await bridgeClient.publishContext({ schemaVersion: 1, applicationId: APP_CONFIG.applicationId, ...context, programInputId: production.inputConfiguration?.programInputId || null, updatedAt: new Date().toISOString() }); } catch (error) { addAlert(`Studio engine context sync failed: ${error.message}`); }
    if (!gfxService.connected || !gfxService.application) return false;
    try { await gfxService.sendProductionContext(context); await refreshGfx(); return true; }
    catch (error) {
      if (error.code === "GFX_COMMAND_TIMEOUT") {
        const snapshot = await refreshGfx();
        if (snapshot.activeProductionId === context.productionId) return true;
      }
      addAlert(`VERO GFX production sync failed: ${error.message}`); return false;
    }
  }, [addAlert, bridgeClient, refreshGfx]);
  const triggerGraphic = useCallback(async (graphic, command) => {
    const key = graphic.graphicId; setGfxCommands((current) => ({ ...current, [key]: command }));
    try { const result = await gfxService.command(command, key); const graphics = await gfxService.refreshGraphics(); setGfx((current) => ({ ...current, graphics })); if (!result.success) throw new Error(result.error || result.message || "VERO GFX did not confirm the command."); return result; }
    catch (error) { addAlert(`${graphic.displayName || key}: ${error.message}`, "error"); return { success: false, error: error.message }; }
    finally { setGfxCommands((current) => { const next = { ...current }; delete next[key]; return next; }); }
  }, [addAlert]);
  return { settings, saveSettings, bridge, localBridge, gfx, gfxCommands, alerts, dismissAlert: (id) => setAlerts((items) => items.filter((item) => item.id !== id)), refresh, publishProduction, triggerGraphic };
}
