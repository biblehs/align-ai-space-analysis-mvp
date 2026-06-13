#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  printf 'v2 structure check failed: %s\n' "$1" >&2
  exit 1
}

expect_missing_paths=(
  "src/app/new-ui"
  "src/app/(member)/(legacy-flow)"
  "src/components/marketing"
  "src/components/layout/Header.tsx"
  "src/components/layout/Footer.tsx"
  "src/components/layout/StepProgress.tsx"
  "src/features/analysis/intake"
  "src/features/analysis/analysis-flow.ts"
  "src/features/auth/backup"
  "src/features/marketing/home"
  "src/features/marketing/new-ui"
)

for path in "${expect_missing_paths[@]}"; do
  if [ -e "$path" ]; then
    fail "legacy or prototype path still exists: $path"
  fi
done

expect_present_paths=(
  "src/app/(public)"
  "src/app/(member)"
  "src/app/(internal)"
  "src/features/app-ui/v2"
  "src/features/marketing/v2"
  "backup/archive-v2-cutover-20260330"
)

for path in "${expect_present_paths[@]}"; do
  if [ ! -e "$path" ]; then
    fail "required active path missing: $path"
  fi
done

if rg -n "features/marketing/new-ui/v2|src/app/new-ui|components/marketing|StepProgress|analysis-flow|legacy-flow" src --glob '!src/features/marketing/v2/LANDING_V2_DESIGN_GUIDE.md' >/tmp/align-v2-structure-rg.txt; then
  cat /tmp/align-v2-structure-rg.txt >&2
  fail "active src tree still references archived legacy structure"
fi

printf 'v2 structure check passed\n'
