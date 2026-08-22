# Releasing VERO Studio

Installed builds check `JacobPhelan1/vero-studio-releases` at startup, every six hours, and from **Check for Updates**. New releases download automatically and install on normal app exit or when the operator requests installation.

## One-time GitHub setup

1. Create the source repository for this folder and push its `main` branch.
2. Create `JacobPhelan1/vero-studio-releases` on GitHub.
3. Add a source-repository Actions secret named `VERO_STUDIO_RELEASE_TOKEN`. Use a fine-grained token with **Contents: Read and write** access to the releases repository.
4. Keep future Windows code-signing credentials in GitHub Actions secrets, never in this repository.

## Publish an update

1. Run `npm version patch`, `npm version minor`, or `npm version major`.
2. Push the commit and tag with `git push origin main --follow-tags`.
3. GitHub Actions tests, builds, and publishes the NSIS installer, block map, and `latest.yml` update metadata.
4. Existing installations detect the higher semantic version and download it automatically.

Never reuse a version number or publish when tests, lint, or the production build fail.
