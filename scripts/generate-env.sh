#!/usr/bin/env bash
# Genera src/environments/environment.ts a partire da .env (dev) o .env.prod (prod).
# Uso:
#   ./scripts/generate-env.sh         → dev
#   ./scripts/generate-env.sh prod    → prod

set -e

MODE="${1:-dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_DIR="$ROOT_DIR/src/environments"

if [ "$MODE" = "prod" ]; then
  ENV_FILE="$ROOT_DIR/.env.prod"
else
  ENV_FILE="$ROOT_DIR/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Errore: file $ENV_FILE non trovato." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

mkdir -p "$ENV_DIR"

if [ "$MODE" = "prod" ]; then
  cat > "$ENV_DIR/environment.prod.ts" <<EOF
export const environment = {
  production: true,
  apiUrl: '${API_URL}',
  cdnUrl: '${CDN_URL:-}',
  aptabaseKey: '${APTABASE_KEY:-}',
};
EOF
  echo "Generato environment.prod.ts"
else
  cat > "$ENV_DIR/environment.ts" <<EOF
export const environment = {
  production: false,
  apiUrl: \`http://\${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000\`,
  cdnUrl: '${CDN_URL:-}',
  aptabaseKey: '${APTABASE_KEY:-}',
};
EOF
  echo "Generato environment.ts"
fi
