#!/usr/bin/env node
/**
 * Builds the terminal-skinned theme-earth zip for Halo — safely.
 *
 * Why this exists: the theme was once rebuilt by extracting to disk on
 * Windows, which silently DROPPED the two `vendor~...` files (filenames
 * ~110 chars long). Cloudflare's cache masked the hole until it expired,
 * and then the whole blog rendered as a black page (theme-earth ships
 * `<body class="hidden">` and its main JS — which 404'd — un-hides it).
 *
 * This script never touches the filesystem for theme content: it patches
 * the original release zip entirely in memory, then VERIFIES that every
 * original entry survived into the output before writing it.
 *
 * Usage (from repo root):
 *   bun halo-theme/build.mjs                 # download original zip + build
 *   bun halo-theme/build.mjs --zip path.zip  # use a local original zip
 *   bun halo-theme/build.mjs --deploy        # build + upload to Halo + probe
 *   bun halo-theme/build.mjs --check-live    # no build: probe live asset URLs
 *
 * Env for --deploy / --check-live:
 *   HALO_BASE_URL  (default https://blog.jasonxiang.net)
 *   HALO_TOKEN     (PAT with theme-management role; --deploy only)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, zipSync } from "fflate";

const HERE = dirname(fileURLToPath(import.meta.url));
const ORIGINAL_ZIP_URL =
  "https://github.com/halo-dev/theme-earth/releases/download/v1.16.1/theme-earth-1.16.1.zip";
// Bump when assets/terminal.css or assets/terminal.js change — cache buster.
const ASSET_VERSION = 5;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};

const BASE_URL = (process.env.HALO_BASE_URL ?? "https://blog.jasonxiang.net").replace(/\/$/, "");
const OUT_PATH = opt("--out", join(HERE, "dist", "theme-earth-terminal.zip"));

const enc = new TextEncoder();
const dec = new TextDecoder();

/** The two lines injected into every page template's <head>. */
const HEAD_SNIPPET = [
  `    <link rel="stylesheet" href="/themes/theme-earth/assets/terminal.css?v=${ASSET_VERSION}">`,
  `    <script defer src="/themes/theme-earth/assets/terminal.js?v=${ASSET_VERSION}"></script>`,
  "",
].join("\n");

async function getOriginalZip() {
  const local = opt("--zip", null);
  if (local) {
    console.log(`original zip: ${local}`);
    return new Uint8Array(readFileSync(local));
  }
  console.log(`downloading original zip: ${ORIGINAL_ZIP_URL}`);
  const res = await fetch(ORIGINAL_ZIP_URL, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

function build(origBytes) {
  const orig = unzipSync(origBytes);
  const origPaths = Object.keys(orig).filter((p) => !p.endsWith("/"));
  console.log(`original entries: ${origPaths.length}`);

  const out = {};
  let patched = 0;
  for (const p of origPaths) {
    // Page templates (incl. error/) get the head snippet; templates/assets/
    // holds static files and the qrcode-share iframe page — leave those alone.
    const isPageTemplate =
      p.startsWith("templates/") &&
      p.endsWith(".html") &&
      !p.startsWith("templates/assets/") && // static files + qrcode-share iframe
      !p.startsWith("templates/modules/"); // headless Thymeleaf fragments
    if (isPageTemplate) {
      const html = dec.decode(orig[p]);
      if (!html.includes("</head>")) throw new Error(`no </head> in ${p}`);
      out[p] = enc.encode(html.replace("</head>", HEAD_SNIPPET + "  </head>"));
      patched++;
    } else {
      out[p] = orig[p];
    }
  }
  out["templates/assets/terminal.css"] = new Uint8Array(readFileSync(join(HERE, "assets", "terminal.css")));
  out["templates/assets/terminal.js"] = new Uint8Array(readFileSync(join(HERE, "assets", "terminal.js")));
  console.log(`templates patched: ${patched}`);

  // ── The guard that would have prevented the black-page outage ──
  const missing = origPaths.filter((p) => !(p in out));
  if (missing.length) throw new Error(`entries LOST during build:\n  ${missing.join("\n  ")}`);
  const vendors = origPaths.filter((p) => /templates\/assets\/vendor~/.test(p));
  if (vendors.length < 2) throw new Error("expected the two vendor~ chunks in the original zip");
  for (const v of vendors) {
    if (!(v in out) || out[v].length !== orig[v].length)
      throw new Error(`vendor chunk corrupted or missing: ${v}`);
  }
  for (const p of origPaths) {
    const isPageTemplate =
      p.startsWith("templates/") &&
      p.endsWith(".html") &&
      !p.startsWith("templates/assets/") && // static files + qrcode-share iframe
      !p.startsWith("templates/modules/"); // headless Thymeleaf fragments
    if (isPageTemplate && !dec.decode(out[p]).includes("terminal.css"))
      throw new Error(`template not patched: ${p}`);
  }
  console.log(`verified: all ${origPaths.length} original entries present (+2 terminal assets), ${vendors.length} vendor chunks intact`);

  return zipSync(out, { level: 6 });
}

/** Every file the theme serves under /themes/theme-earth/assets/ must be 200. */
async function probeLiveAssets(assetPaths) {
  let bad = 0;
  for (const p of assetPaths) {
    const url = `${BASE_URL}/themes/theme-earth/assets/${p}`;
    const res = await fetch(url, { method: "GET", redirect: "manual" }).catch(() => null);
    if (!res || res.status !== 200) {
      console.error(`  ${res ? res.status : "ERR"}  ${p}`);
      bad++;
    }
  }
  if (bad) throw new Error(`${bad} live asset(s) broken — the blog may be black-paging`);
  console.log(`live probe: all ${assetPaths.length} assets return 200 ✓`);
}

async function deploy(zipBytes) {
  const token = process.env.HALO_TOKEN;
  if (!token) throw new Error("--deploy needs HALO_TOKEN (Halo Console → Personal Access Tokens)");
  const form = new FormData();
  form.append("file", new Blob([zipBytes], { type: "application/zip" }), "theme-earth-terminal.zip");
  const res = await fetch(`${BASE_URL}/apis/api.console.halo.run/v1alpha1/themes/theme-earth/upgrade`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`upgrade failed: HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  console.log("theme upgraded on server ✓");
}

const main = async () => {
  const origBytes = await getOriginalZip();
  const orig = unzipSync(origBytes);
  const assetPaths = Object.keys(orig)
    .filter((p) => p.startsWith("templates/assets/") && !p.endsWith("/"))
    .map((p) => p.slice("templates/assets/".length))
    .concat([`terminal.css?v=${ASSET_VERSION}`, `terminal.js?v=${ASSET_VERSION}`]);

  if (flag("--check-live")) {
    await probeLiveAssets(assetPaths);
    return;
  }

  const zipBytes = build(origBytes);
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, zipBytes);
  console.log(`wrote ${OUT_PATH} (${zipBytes.length} bytes)`);

  if (flag("--deploy")) {
    await deploy(zipBytes);
    // Give Halo a beat to unpack, then verify every asset actually serves.
    await new Promise((r) => setTimeout(r, 3000));
    await probeLiveAssets(assetPaths);
  }
};

main().catch((e) => {
  console.error(`\nFAILED: ${e.message}`);
  process.exit(1);
});
