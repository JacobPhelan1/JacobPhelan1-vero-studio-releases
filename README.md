# VERO Studio

VERO Studio is a standalone Electron + React broadcast-production environment. Studio owns its native inputs, Preview and Program buses, production state, and VERO ecosystem connections.

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

Studio remains usable while VERO GFX, accounts, Replay, and Audio services are offline. Unsupported engine features stay explicitly unavailable.

The Windows installer is emitted to `release/VERO-Studio-Setup-<version>.exe`. See [docs/STUDIO-ENGINE.md](docs/STUDIO-ENGINE.md) for architecture and [docs/RELEASING.md](docs/RELEASING.md) for the GitHub Releases auto-update workflow.
