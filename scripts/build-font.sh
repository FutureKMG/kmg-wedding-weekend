#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v fontforge >/dev/null 2>&1; then
  echo "[font-build] fontforge is not installed or not on PATH." >&2
  echo "[font-build] Install FontForge first, then rerun npm run font:build." >&2
  exit 1
fi

fontforge -lang=py -script scripts/build-font.pe
