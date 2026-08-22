# VERO Studio

VERO Studio V0.1 is a standalone Electron + React production-control application. It uses the existing VERO Local Bridge contract and treats vMix XML state as authoritative.

## Development

```powershell
npm install
npm run dev
npm test
npm run lint
npm run build
npm run desktop:start
npm run desktop:package
```

The UI works safely while Bridge, vMix, GFX, accounts, Replay, and Audio services are offline. Unsupported features stay explicitly unavailable.

The Windows installer is emitted to `release/VERO-Studio-Setup-<version>.exe`. See [docs/V0.1-DEVELOPMENT-SUMMARY.md](docs/V0.1-DEVELOPMENT-SUMMARY.md) for architecture and [docs/RELEASING.md](docs/RELEASING.md) for the GitHub Releases auto-update workflow.
