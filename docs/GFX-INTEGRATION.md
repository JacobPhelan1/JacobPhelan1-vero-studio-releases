# VERO Studio ↔ VERO GFX Integration

VERO Studio implements the VERO GFX Studio Protocol V1 exactly as exposed by the GFX Local Bridge on `127.0.0.1:43110`.

## Runtime flow

1. Studio checks `/__vero/studio/health` and requires protocol version `1`.
2. Studio renews its per-launch lease through `/__vero/studio/connect` every five seconds.
3. Registered `vero-gfx` metadata provides the application version, active production, capabilities, graphics catalog, and output health.
4. The active Studio production is sent to `/__vero/studio/production-context` with stable production, event, workspace, account, organization, team, and package IDs.
5. Producer quick controls send only `TAKE` and `OUT` through `/__vero/studio/graphics/action` and wait for the real GFX result.
6. Studio consumes cursor-based events from `/__vero/studio/events` and reconciles against GFX's authoritative metadata.

Studio owns active production and event context. GFX owns graphics content, mappings, packages, databases, layers, and output state. Studio remains functional when GFX is missing, disconnected, incompatible, or unable to reach vMix.

Protocol V1 is loopback-only, exchanges no passwords or account tokens, validates the GFX application identity, and exposes no low-level vMix commands.
