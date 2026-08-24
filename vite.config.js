import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createStudioBridge } from "./desktop/studioBridge.js";
export default defineConfig({ plugins: [react(), { name: "vero-studio-engine", configureServer(server) { server.middlewares.use(createStudioBridge({ studioUrl: "http://127.0.0.1:5173", applicationVersion: process.env.npm_package_version || "development" })); } }], server: { port: 5173, strictPort: true } });
