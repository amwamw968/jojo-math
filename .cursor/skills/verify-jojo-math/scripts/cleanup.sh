#!/usr/bin/env bash
# Stop only the preview process group started by launch.sh.
set -euo pipefail

PID_FILE=/tmp/jojo-math-verify.pid
if [[ ! -f "$PID_FILE" ]]; then
  echo "no pid file; nothing to stop"
  exit 0
fi

pid=$(cat "$PID_FILE")
if kill -0 "$pid" 2>/dev/null; then
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  sleep 0.4
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  fi
fi
rm -f "$PID_FILE"
echo "stopped preview pid $pid"
