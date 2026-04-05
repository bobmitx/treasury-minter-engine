#!/bin/bash
cd /home/z/my-project
FIRST_RUN=true
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "[$(date '+%H:%M:%S')] Starting server..." >> dev.log
    pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null
    sleep 1
    if [ "$FIRST_RUN" = true ]; then
      rm -rf .next
      FIRST_RUN=false
    fi
    bun run dev >> dev.log 2>&1 &
    echo "[$(date '+%H:%M:%S')] Server PID=$!" >> dev.log
  fi
  sleep 8
done
