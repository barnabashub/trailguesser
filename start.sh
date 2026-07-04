#!/usr/bin/env bash
# TrailGuesser indítása Linux/macOS alatt. A böngészőt is megnyitja.
cd "$(dirname "$0")"
echo "TrailGuesser indítása..."
(
  sleep 1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:8080
  elif command -v open >/dev/null 2>&1; then
    open http://localhost:8080
  fi
) &
node server.js
