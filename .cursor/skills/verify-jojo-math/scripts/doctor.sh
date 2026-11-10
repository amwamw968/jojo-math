#!/usr/bin/env bash
# Read-only check that port 4175 is this 乔乔奥数 build.
set -euo pipefail

PORT=4175
HTML=$(curl -fsS "http://127.0.0.1:${PORT}/")
printf '%s' "$HTML" | grep -q "<title>小学奥数智能学习平台</title>"
printf '%s' "$HTML" | grep -q 'src="/assets/' || printf '%s' "$HTML" | grep -q 'src="/src/main.tsx"' || true

SKILL_DIR=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
cd "$ROOT"
node --input-type=module << 'EOF'
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";

const chrome = ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find((path) => existsSync(path));
if (!chrome) {
  console.error("system Chrome was not found");
  process.exit(1);
}
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:4175/", { waitUntil: "networkidle" });
const app = await page.locator('[data-app="jojo-math"]').count();
const title = await page.title();
await browser.close();
if (app !== 1 || title !== "小学奥数智能学习平台") {
  console.error(`doctor failed title=${title} data-app count=${app}`);
  process.exit(1);
}
console.log("doctor ok: data-app=jojo-math title=小学奥数智能学习平台");
EOF
