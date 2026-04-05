#!/bin/bash
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "[$(date)] Server not running, restarting..." >> dev.log
    NODE_OPTIONS="--max-old-space-size=4096" node node_modules/.bin/next dev -p 3000 >> dev.log 2>&1 &
    SERVER_PID=$!
    echo "[$(date)] Started server PID=$SERVER_PID" >> dev.log
  fi
  sleep 10
done
