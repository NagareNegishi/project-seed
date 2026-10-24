import * as esbuild from "esbuild";
import { zipSync } from "fflate";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { firefoxManifest, storeManifest } from "./storeManifest.mjs";

const watch = process.argv.includes("--watch");
const firefox = process.argv.includes("--firefox");
// --store: production hosts, no dev entries or key in the manifest, no sourcemaps, zipped for upload
// --firefox: the same, with Firefox's manifest, into its own folder and zip
const store = firefox || process.argv.includes("--store");
// --prod-local: production hosts but the dev manifest, so the pinned key keeps the store id for loading unpacked; not zipped
const prodLocal = process.argv.includes("--prod-local");
const outdir = firefox ? "dist-firefox" : store ? "dist-store" : prodLocal ? "dist-prod-local" : "dist";
const zipName = firefox ? "<project>-firefox.zip" : "<project>-extension.zip";

const options = {
  entryPoints: {
    background: "src/worker/background.ts",
    "popup/main": "src/popup/main.ts",
    "content/main": "src/content/main.ts",
  },
  bundle: true,
  outdir,
  format: "esm",
  target: "es2022",
  sourcemap: !store,
  define: { __PROD__: String(store || prodLocal) },
  // the panel's markup imports as a string; the popup's index.html is copied, not imported
  loader: { ".html": "text" },
};

// manifest.json is the extension's entry point, so it ships beside background.js;
// the popup page is static, so it is copied rather than bundled
async function copyStatic() {
  await mkdir(`${outdir}/popup`, { recursive: true });
  if (store) {
    const dev = JSON.parse(await readFile("manifest.json", "utf8"));
    const manifest = firefox ? firefoxManifest(dev) : storeManifest(dev);
    await writeFile(`${outdir}/manifest.json`, JSON.stringify(manifest, null, 2));
  } else {
    await copyFile("manifest.json", `${outdir}/manifest.json`);
  }
  await copyFile("src/popup/index.html", `${outdir}/popup/index.html`);
  // the app icon: the manifest's toolbar and extensions-page sizes, and the 64px on-page button served to pages as a web-accessible resource
  await mkdir(`${outdir}/icons`, { recursive: true });
  for (const size of [16, 32, 64, 128]) {
    await copyFile(`../assets/brand/png/<project>-${size}.png`, `${outdir}/icons/<project>-${size}.png`);
  }
  // the wordmark in the popup and panel headers, the same file the web app's BrandLogo shows
  await copyFile("../assets/brand/svg/logo-<project>.svg", `${outdir}/icons/logo-<project>.svg`);
}

// Every file under dir keyed by its path with "/" separators, as the stores require, so manifest.json sits at the zip root.
async function collectFiles(dir, prefix = "") {
  const files = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(files, await collectFiles(join(dir, entry.name), `${path}/`));
    else files[path] = new Uint8Array(await readFile(join(dir, entry.name)));
  }
  return files;
}

// The Chrome build's zip serves both the Chrome Web Store and Edge Add-ons; Firefox AMO gets its own.
async function zipStoreBuild() {
  await writeFile(zipName, zipSync(await collectFiles(outdir)));
}

if (watch) {
  const ctx = await esbuild.context(options);
  await copyStatic();
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  // a stale file from an earlier store build would otherwise ship in the zip
  if (store) await rm(outdir, { recursive: true, force: true });
  await esbuild.build(options);
  await copyStatic();
  if (store) await zipStoreBuild();
  console.log("Build complete.");
}
