#!/usr/bin/env bash
# Drive the local 乔乔奥数 preview and write evidence screenshots.
set -euo pipefail

SKILL_DIR=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
cd "$ROOT"
node "$SKILL_DIR/scripts/drive.mjs"
