# Releasing VERO Studio

Installed builds check `JacobPhelan1/JacobPhelan1-vero-studio-releases` at startup, every six hours, and from **Check for Updates**. New releases download automatically and install on normal app exit or when the operator requests installation.

## One-time GitHub setup

1. Push this folder to `JacobPhelan1/JacobPhelan1-vero-studio-releases`.
2. Keep GitHub Actions **Read and write permissions** enabled so the built-in `GITHUB_TOKEN` can create releases.
3. Keep future Windows code-signing credentials in GitHub Actions secrets, never in this repository.

## Publish an update

1. Run `npm version patch`, `npm version minor`, or `npm version major`.
2. Push the commit and tag with `git push origin main --follow-tags`.
3. GitHub Actions tests, builds, and publishes the NSIS installer, block map, and `latest.yml` update metadata.
4. Existing installations detect the higher semantic version and download it automatically.

Never reuse a version number or publish when tests, lint, or the production build fail.

## Free trusted test build

For development machines controlled by VERO, run `npm run desktop:package:trusted-test`. This creates a non-exportable self-signed development key in the current Windows user's certificate store and signs the installer. Install `release/VERO-Studio-Development.cer` once into the current user's **Trusted Root Certification Authorities** and **Trusted Publishers** stores before running the installer. This is suitable only for private development and testing. It does not replace public code signing and should never be represented as publicly trusted.
