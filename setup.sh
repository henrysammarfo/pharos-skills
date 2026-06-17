#!/usr/bin/env bash
set -euo pipefail
echo "=== Pharos Skills Setup ==="

command -v node >/dev/null || { echo "Node.js required"; exit 1; }
command -v npm >/dev/null || { echo "npm required"; exit 1; }
command -v forge >/dev/null || { echo "Foundry required: https://book.getfoundry.sh"; exit 1; }

npm install
forge install
forge build
npm run compile
forge test
npm test

if [ ! -f deployments.json ]; then
  cp deployments.example.json deployments.json
  echo "Copied deployments.example.json -> deployments.json"
fi

git config core.hooksPath .githooks 2>/dev/null || true

echo ""
echo "=== Setup complete ==="
echo "Read-only judge test:  npm run judge:readiness"
echo "SDK smoke test:        npm run test:sdk"
echo "MCP smoke test:        npm run test:mcp"
echo "Full agent+wallet:     npm run test:agent   (needs funded wallet.json)"
echo "MCP server:            npm run mcp"
echo "HTTP x402:             npm run x402:http"
