#!/bin/bash
set -e

INSTALL_DIR="${AICOUNCIL_HOME:-$HOME/.aicouncil}"
REPO="https://github.com/Deger/AICouncil.git"

echo "==> Installing aicouncil..."

if [ -d "$INSTALL_DIR" ]; then
  echo "==> Updating existing installation at $INSTALL_DIR"
  cd "$INSTALL_DIR" && git pull --quiet
else
  echo "==> Cloning into $INSTALL_DIR"
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install --silent
npm link --silent

echo "==> Installing skill..."
npx skills add Deger/AICouncil -g -y 2>/dev/null || echo "  (skill install skipped — run 'aicouncil update' later)"

echo ""
echo "Done! Run 'aicouncil doctor' to verify, then '/aic <topic>' in your AI tool."
echo "To update: aicouncil update"
