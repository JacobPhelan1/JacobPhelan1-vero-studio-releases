import { APP_CONFIG } from "../../config/appConfig.js";

export const GFX_PROTOCOL_VERSION = 1;
export const GFX_CONNECTION_STATES = Object.freeze({ CONNECTED: "Connected", NOT_CONNECTED: "GFX Not Running", ENDPOINT_UNAVAILABLE: "GFX Protocol Endpoint Unavailable", ERROR: "GFX Error", INCOMPATIBLE: "Version Incompatible" });
const STUDIO_CAPABILITIES = ["production-context", "graphics-quick-actions", "state-events"];
const text = (value) => String(value || "").trim();

export class GfxProtocolError extends Error {
  constructor(message, { status = 0, code = "GFX_ERROR", protocolVersion = null } = {}) { super(message); this.name = "GfxProtocolError"; this.status = status; this.code = code; this.protocolVersion = protocolVersion; }
}

async function parseResponse(response) {
  const type = response.headers?.get?.("content-type") || "";
  if (!type.includes("application/json")) throw new GfxProtocolError("VERO GFX does not expose the Studio Protocol V1 endpoint.", { status: response.status, code: "GFX_PROTOCOL_UNAVAILABLE" });
  const result = await response.json();
  if (!response.ok || result.ok === false) throw new GfxProtocolError(result.message || result.error || `VERO GFX request failed (HTTP ${response.status}).`, { status: response.status, code: result.error || (response.status === 409 ? "VERSION_INCOMPATIBLE" : "GFX_REQUEST_FAILED"), protocolVersion: result.protocolVersion });
  return result;
}

export class GfxService {
  constructor({ baseUrl = APP_CONFIG.services.gfxProtocolUrl, fetcher = null } = {}) { this.baseUrl = baseUrl.replace(/\/$/, ""); this.fetcher = fetcher || ((...args) => globalThis.fetch(...args)); this.instanceId = `vero-studio-${crypto.randomUUID()}`; this.connected = false; this.cursor = 0; this.application = null; this.lastProductionSignature = ""; this.pendingProduction = null; }
  setBaseUrl(baseUrl) { const next = baseUrl.replace(/\/$/, ""); if (next !== this.baseUrl) { this.baseUrl = next; this.connected = false; this.cursor = 0; this.application = null; this.lastProductionSignature = ""; this.pendingProduction = null; } }
  async request(path, options = {}) {
    let response;
    try { response = await this.fetcher(`${this.baseUrl}/__vero/studio${path}`, { cache: "no-store", signal: AbortSignal.timeout(options.timeout || 2600), ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
    catch (error) { if (error instanceof GfxProtocolError) throw error; throw new GfxProtocolError(`VERO GFX is not running at ${this.baseUrl}. ${error.message || "The connection failed."}`, { code: "GFX_NOT_RUNNING" }); }
    return parseResponse(response);
  }
  async connect({ accountId = "", workspaceId = "" } = {}) {
    let health;
    try { health = await this.request("/health"); }
    catch (error) { if (error.code === "GFX_PROTOCOL_UNAVAILABLE") throw new GfxProtocolError("The VERO GFX application is running, but its Protocol V1 endpoint is unavailable.", { code: "GFX_PROTOCOL_UNAVAILABLE" }); throw error; }
    if (health.applicationId !== "vero-gfx" || health.applicationType !== "gfx") throw new GfxProtocolError("The endpoint did not identify itself as the VERO GFX application.", { code: "GFX_PROTOCOL_UNAVAILABLE" });
    if (Number(health.protocolVersion) !== GFX_PROTOCOL_VERSION) { this.connected = false; throw new GfxProtocolError(`VERO GFX protocol ${health.protocolVersion || "missing"} is incompatible with Studio protocol ${GFX_PROTOCOL_VERSION}.`, { code: "VERSION_INCOMPATIBLE", protocolVersion: health.protocolVersion }); }
    const result = await this.request("/connect", { method: "POST", body: JSON.stringify({ protocolVersion: GFX_PROTOCOL_VERSION, instanceId: this.instanceId, applicationVersion: APP_CONFIG.version, accountId, workspaceId, capabilities: STUDIO_CAPABILITIES }) });
    this.connected = true;
    const application = (result.gfxApplications || []).find((item) => item.applicationId === "vero-gfx" && item.applicationType === "gfx") || null;
    if (this.application?.instanceId && application?.instanceId !== this.application.instanceId) this.lastProductionSignature = "";
    this.application = application;
    return this.snapshot(health);
  }
  snapshot(health = {}) {
    const app = this.application;
    if (!app) return { status: GFX_CONNECTION_STATES.ERROR, error: "The GFX Protocol service is online, but the GFX application has not registered yet.", protocolEndpointConnected: true, applicationId: health.applicationId, applicationType: health.applicationType, version: health.applicationVersion || "—", protocolVersion: health.protocolVersion, capabilities: health.capabilities || [], graphics: [], output: {} };
    return { status: GFX_CONNECTION_STATES.CONNECTED, protocolEndpointConnected: true, applicationId: app.applicationId, applicationType: app.applicationType, instanceId: app.instanceId, version: app.applicationVersion || health.applicationVersion || "—", protocolVersion: app.protocolVersion, capabilities: Array.isArray(app.capabilities) ? app.capabilities : [], activeProductionId: app.activeProductionId || "", activeProductionName: app.activeProductionName || "", workspaceId: app.workspaceId || "", accountId: app.accountId || "", graphics: Array.isArray(app.graphics) ? app.graphics : [], output: app.output && typeof app.output === "object" ? app.output : {} };
  }
  async refreshGraphics() { const result = await this.request("/graphics"); return Array.isArray(result.graphics) ? result.graphics : []; }
  async sendProductionContext(productionContext) {
    if (!this.connected) throw new GfxProtocolError("VERO GFX is not connected.", { code: "GFX_NOT_CONNECTED" });
    const signature = JSON.stringify(productionContext || {});
    if (signature === this.lastProductionSignature) return { ok: true, success: true, deduplicated: true, resultingState: { productionId: productionContext?.productionId || "" } };
    if (this.pendingProduction?.signature === signature) return this.pendingProduction.promise;
    const promise = this.request("/production-context", { method: "POST", timeout: 18000, body: JSON.stringify({ studioInstanceId: this.instanceId, productionContext }) })
      .then((result) => { this.lastProductionSignature = signature; if (this.application) this.application = { ...this.application, activeProductionId: productionContext?.productionId || "", activeProductionName: productionContext?.productionName || "" }; return result; })
      .finally(() => { if (this.pendingProduction?.promise === promise) this.pendingProduction = null; });
    this.pendingProduction = { signature, promise };
    return promise;
  }
  async command(command, graphicId, payload = {}) { const normalized = text(command).toUpperCase(); if (!["TAKE", "OUT"].includes(normalized)) throw new GfxProtocolError(`Studio does not support the ${normalized || "empty"} graphics command.`, { code: "UNSUPPORTED_COMMAND" }); return this.request("/graphics/action", { method: "POST", timeout: 10000, body: JSON.stringify({ studioInstanceId: this.instanceId, command: normalized, graphicId: text(graphicId), payload }) }); }
  async events() { if (!this.connected) return []; const result = await this.request(`/events?cursor=${this.cursor}`); this.cursor = Math.max(this.cursor, Number(result.cursor) || 0); return Array.isArray(result.events) ? result.events : []; }
  async disconnect() { if (!this.connected) return; try { await this.request("/disconnect", { method: "POST", body: JSON.stringify({ instanceId: this.instanceId }) }); } finally { this.connected = false; this.application = null; } }
}

export const gfxService = new GfxService();
