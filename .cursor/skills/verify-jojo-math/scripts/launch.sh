#!/usr/bin/env bash
# Start the production preview for 乔乔奥数 and wait until the HTML title is served.
set -euo pipefail

SKILL_DIR=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
PORT=4175
PID_FILE=/tmp/jojo-math-verify.pid
LOG=/tmp/jojo-math-verify.log

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "already running pid $(cat "$PID_FILE")"
else
  cd "$ROOT"
  npm run build > /tmp/jojo-math-verify-build.log
  # setsid makes the preview its own process group so cleanup can kill only this server.
  setsid npx vite preview --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 &
  echo $! >"$PID_FILE"
fi

for _ in $(seq 1 50); do
  if curl -fsS "http://127.0.0.1:${PORT}/" | grep -q "<title>小学奥数智能学习平台</title>"; then
    echo "ready http://127.0.0.1:${PORT}/"
    exit 0
  fi
  sleep 0.2
done

echo "preview did not become ready; see $LOG" >&2
exit 1
