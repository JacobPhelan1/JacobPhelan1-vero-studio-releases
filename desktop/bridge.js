import http from "node:http";
import { lookup } from "node:dns/promises";

const isPrivate = (address) => { const p = address.split(".").map(Number); return p.length === 4 && (p[0] === 127 || p[0] === 10 || (p[0] === 192 && p[1] === 168) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31)); };
export function createVmixProxy({ bridgeUrl }) {
  return async (request, response, next) => {
    const incoming = new URL(request.url, "http://vero.local");
    if (incoming.pathname === "/__vero/bridge/health") { response.setHeader("Content-Type", "application/json"); response.setHeader("Cache-Control", "no-store"); response.end(JSON.stringify({ ok: true, service: "VERO Local Bridge", version: "0.3", bridgeUrl, capabilities: ["vmix-state", "vmix-command"] })); return; }
    if (incoming.pathname !== "/__vero/vmix") return next();
    response.setHeader("Cache-Control", "no-store");
    try {
      const host = incoming.searchParams.get("host") || ""; const port = Number(incoming.searchParams.get("port"));
      if (!host || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid vMix endpoint.");
      const resolved = await lookup(host, { family: 4 }); if (!isPrivate(resolved.address)) throw new Error("Only loopback and private LAN vMix hosts are permitted.");
      incoming.searchParams.delete("host"); incoming.searchParams.delete("port");
      const path = `/API/${incoming.searchParams.size ? `?${incoming.searchParams}` : ""}`;
      const upstream = http.request({ hostname: resolved.address, port, path, method: "GET", timeout: 6000, headers: { Host: `${host}:${port}` } }, (upstreamResponse) => { response.statusCode = upstreamResponse.statusCode || 502; response.setHeader("Content-Type", upstreamResponse.headers["content-type"] || "text/plain"); upstreamResponse.pipe(response); });
      upstream.on("timeout", () => upstream.destroy(new Error("vMix request timed out.")));
      upstream.on("error", (error) => { if (!response.headersSent) { response.statusCode = 502; response.setHeader("Content-Type", "application/json"); } response.end(JSON.stringify({ ok: false, error: error.message })); }); upstream.end();
    } catch (error) { response.statusCode = 400; response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ ok: false, error: error.message })); }
  };
}
