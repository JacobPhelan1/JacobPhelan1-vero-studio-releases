import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createStudioBridge } from "./desktop/studioBridge.js";
export default defineConfig({ plugins: [react(), { name: "vero-studio-bridge", configureServer(server) { server.middlewares.use(createStudioBridge({ bridgeUrl: "http://127.0.0.1:5173" })); } }], server: { port: 5173, strictPort: true } });
