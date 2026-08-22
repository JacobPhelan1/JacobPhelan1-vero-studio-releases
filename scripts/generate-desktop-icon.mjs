import { mkdir, writeFile } from "node:fs/promises";
import pngToIco from "png-to-ico";

await mkdir("build", { recursive: true });
const icon = await pngToIco("public/brand/studio/IconStudio.png");
await writeFile("build/VERO-Studio.ico", icon);
console.info("Generated build/VERO-Studio.ico from the official Studio icon.");
