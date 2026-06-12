#!/usr/bin/env bash
# UI Tour Screenshot Capture via Chrome Headless
# Usage: bash scripts/capture-screenshots.sh

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL="http://localhost:3000"
OUT_DIR="/Users/a0g11b6/Downloads/projects/architex/architex/docs/CODEMAPS/screenshots"
DESKTOP_SIZE="1440,900"
MOBILE_SIZE="390,844"
VIRTUAL_BUDGET=8000

mkdir -p "$OUT_DIR"

capture() {
  local path="$1"
  local name="$2"
  local size="$3"
  local suffix="$4"
  local outfile="$OUT_DIR/${name}-${suffix}.png"

  echo "Capturing ${path} (${suffix}) → ${name}-${suffix}.png"
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --screenshot="${outfile}" \
    --window-size="${size}" \
    --virtual-time-budget="${VIRTUAL_BUDGET}" \
    "${BASE_URL}${path}" 2>&1 | grep -v "^$" | grep -v "ERROR:gpu" | grep -v "task_policy" | head -3
  echo "  → done ($(wc -c < "${outfile}" 2>/dev/null || echo '0') bytes)"
}

# Desktop + mobile top 3
capture "/" "home" "$DESKTOP_SIZE" "desktop"
capture "/" "home" "$MOBILE_SIZE" "mobile"
capture "/pricing" "pricing" "$DESKTOP_SIZE" "desktop"
capture "/pricing" "pricing" "$MOBILE_SIZE" "mobile"
capture "/blog" "blog" "$DESKTOP_SIZE" "desktop"
capture "/blog" "blog" "$MOBILE_SIZE" "mobile"

# Desktop-only for rest
capture "/gallery" "gallery" "$DESKTOP_SIZE" "desktop"
capture "/learn" "learn" "$DESKTOP_SIZE" "desktop"
capture "/modules" "modules" "$DESKTOP_SIZE" "desktop"
capture "/concepts" "concepts" "$DESKTOP_SIZE" "desktop"
capture "/lld-problems" "lld-problems" "$DESKTOP_SIZE" "desktop"
capture "/algorithms" "algorithms" "$DESKTOP_SIZE" "desktop"
capture "/database" "database" "$DESKTOP_SIZE" "desktop"
capture "/ds" "ds" "$DESKTOP_SIZE" "desktop"
capture "/os" "os" "$DESKTOP_SIZE" "desktop"
capture "/patterns" "patterns" "$DESKTOP_SIZE" "desktop"
capture "/problems" "problems" "$DESKTOP_SIZE" "desktop"
capture "/dashboard" "dashboard" "$DESKTOP_SIZE" "desktop"
capture "/sign-in" "sign-in" "$DESKTOP_SIZE" "desktop"

echo ""
echo "All captures done. Files in: $OUT_DIR"
ls -la "$OUT_DIR"/*.png 2>/dev/null | awk '{print $5, $9}'
