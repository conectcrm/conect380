#!/bin/sh
set -e

if [ ! -x node_modules/.bin/ts-node-dev ]; then
  echo "📦 node_modules ausente ou incompleto, executando npm ci..."
  npm ci --legacy-peer-deps
fi

exec "$@"
