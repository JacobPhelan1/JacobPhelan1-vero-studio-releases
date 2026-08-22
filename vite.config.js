import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createVmixProxy } from "./desktop/bridge.js";
export default defineConfig({ plugins: [react(), { name: "vero-local-bridge", configureServer(server) { server.middlewares.use(createVmixProxy({ bridgeUrl: "http://127.0.0.1:5173" })); } }], server: { port: 5173, strictPort: true } });
