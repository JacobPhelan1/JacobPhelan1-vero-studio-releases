import assert from "node:assert/strict";
import test from "node:test";
import { GFX_PROTOCOL_VERSION, GfxService } from "../src/integrations/gfx/gfxService.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("Protocol V1 connects, exchanges identity, and exposes real GFX metadata", async () => {
  const requests = [];
  const fetcher = async (url, options = {}) => {
    requests.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
    if (url.endsWith("/health")) return json({ ok: true, applicationId: "vero-gfx", applicationType: "gfx", applicationVersion: "0.14.10", protocolVersion: 1, gfxApplications: 1 });
    if (url.endsWith("/connect")) return json({ ok: true, protocolVersion: 1, gfxApplications: [{ applicationId: "vero-gfx", applicationType: "gfx", applicationVersion: "0.14.10", instanceId: "gfx-1", protocolVersion: 1, activeProductionId: "prod-1", activeProductionName: "Roland @ Muldrow", capabilities: ["production-context", "graphics-quick-actions"], graphics: [{ graphicId: "scorebug", displayName: "Scorebug", ready: true }], output: { bridge: "available", vmix: "Connected" } }] });
    throw new Error(`Unexpected request ${url}`);
  };
  const service = new GfxService({ fetcher });
  const result = await service.connect({ accountId: "account-1", workspaceId: "workspace-1" });
  assert.equal(result.status, "Connected");
  assert.equal(result.version, "0.14.10");
  assert.equal(result.graphics[0].graphicId, "scorebug");
  assert.equal(requests[1].body.protocolVersion, GFX_PROTOCOL_VERSION);
  assert.match(requests[1].body.instanceId, /^vero-studio-/);
  assert.equal(requests[1].body.workspaceId, "workspace-1");
});

test("rejects an incompatible broker protocol before sending commands", async () => {
  const service = new GfxService({ fetcher: async () => json({ ok: true, applicationId: "vero-gfx", applicationType: "gfx", protocolVersion: 2 }) });
  await assert.rejects(service.connect(), (error) => error.code === "VERSION_INCOMPATIBLE" && error.protocolVersion === 2);
  assert.equal(service.connected, false);
});

test("identifies an application without the dedicated Protocol V1 endpoint", async () => {
  const service = new GfxService({ fetcher: async () => new Response("<!doctype html><title>VERO GFX</title>", { status: 200, headers: { "content-type": "text/html" } }) });
  await assert.rejects(service.connect(), (error) => error.code === "GFX_PROTOCOL_UNAVAILABLE" && /endpoint is unavailable/i.test(error.message));
});

test("rejects a service that does not identify as the GFX application", async () => {
  const service = new GfxService({ fetcher: async () => json({ ok: true, applicationId: "vero-bridge", applicationType: "bridge", protocolVersion: 1 }) });
  await assert.rejects(service.connect(), (error) => error.code === "GFX_PROTOCOL_UNAVAILABLE" && /did not identify/i.test(error.message));
});

test("sends the GFX production-context schema and waits for confirmed commands", async () => {
  const requests = [];
  const fetcher = async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ url, body });
    if (url.endsWith("/health")) return json({ ok: true, applicationId: "vero-gfx", applicationType: "gfx", protocolVersion: 1 });
    if (url.endsWith("/connect")) return json({ ok: true, gfxApplications: [{ applicationId: "vero-gfx", applicationType: "gfx", protocolVersion: 1 }] });
    if (url.endsWith("/production-context")) return json({ ok: true, success: true, resultingState: { productionId: body.productionContext.productionId } });
    if (url.endsWith("/graphics/action")) return json({ ok: true, success: true, command: body.command, graphicId: body.graphicId, resultingState: "on-air" });
    throw new Error(`Unexpected request ${url}`);
  };
  const service = new GfxService({ fetcher });
  await service.connect();
  await service.sendProductionContext({ productionId: "prod-1", eventId: "event-1", homeTeamId: "home", awayTeamId: "away" });
  const result = await service.command("TAKE", "scorebug");
  const contextRequest = requests.find((item) => item.url.endsWith("/production-context"));
  assert.equal(contextRequest.body.studioInstanceId, service.instanceId);
  assert.deepEqual(contextRequest.body.productionContext, { productionId: "prod-1", eventId: "event-1", homeTeamId: "home", awayTeamId: "away" });
  assert.equal(result.success, true);
  assert.equal(result.resultingState, "on-air");
});

test("coalesces identical production-context submissions", async () => {
  let contextRequests = 0;
  let release;
  const fetcher = async (url) => {
    if (url.endsWith("/health")) return json({ ok: true, applicationId: "vero-gfx", applicationType: "gfx", protocolVersion: 1 });
    if (url.endsWith("/connect")) return json({ ok: true, gfxApplications: [{ applicationId: "vero-gfx", applicationType: "gfx", instanceId: "gfx-1", protocolVersion: 1 }] });
    if (url.endsWith("/production-context")) { contextRequests += 1; await new Promise((resolve) => { release = resolve; }); return json({ ok: true, success: true }); }
    throw new Error(`Unexpected request ${url}`);
  };
  const service = new GfxService({ fetcher });
  await service.connect();
  const context = { productionId: "prod-1", productionName: "Game" };
  const first = service.sendProductionContext(context);
  const second = service.sendProductionContext(context);
  assert.equal(contextRequests, 1);
  release();
  await Promise.all([first, second]);
  const third = await service.sendProductionContext(context);
  assert.equal(contextRequests, 1);
  assert.equal(third.deduplicated, true);
});

test("preserves the GFX timeout error code for late-confirmation reconciliation", async () => {
  const service = new GfxService({ fetcher: async () => json({ ok: false, error: "GFX_COMMAND_TIMEOUT", message: "GFX replied too late." }, 504) });
  service.connected = true;
  await assert.rejects(service.sendProductionContext({ productionId: "prod-1" }), (error) => error.code === "GFX_COMMAND_TIMEOUT" && /too late/i.test(error.message));
});

test("advances the GFX event cursor and never reports failed actions as successful", async () => {
  let eventCall = 0;
  const fetcher = async (url) => {
    if (url.endsWith("/health")) return json({ ok: true, applicationId: "vero-gfx", applicationType: "gfx", protocolVersion: 1 });
    if (url.endsWith("/connect")) return json({ ok: true, gfxApplications: [{ applicationId: "vero-gfx", applicationType: "gfx", protocolVersion: 1 }] });
    if (url.includes("/events?cursor=")) { eventCall += 1; return json({ ok: true, cursor: 7, events: eventCall === 1 ? [{ cursor: 7, type: "GFX_STATE_CHANGED", payload: { layers: { SCOREBUG: "scorebug" } } }] : [] }); }
    if (url.endsWith("/graphics/action")) return json({ ok: false, success: false, error: "vMix unavailable" }, 422);
    throw new Error(`Unexpected request ${url}`);
  };
  const service = new GfxService({ fetcher });
  await service.connect();
  assert.equal((await service.events())[0].payload.layers.SCOREBUG, "scorebug");
  assert.equal(service.cursor, 7);
  await assert.rejects(service.command("OUT", "scorebug"), /vMix unavailable/);
});
