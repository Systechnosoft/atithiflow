#!/usr/bin/env sh
set -e

log() {
  printf "[%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1"
}

log "Starting AtithiFlow backend startup pipeline..."

log "Validating environment variables..."
npm run validate-env

log "Validating runtime dependencies..."
npm run validate-deps

log "Checking database connectivity..."
npm run validate-db

log "Validating migration metadata..."
npm run validate-migrations

log "Executing pending migrations..."
npm run migrate

log "Validating seed requirements..."
set +e
npm run validate-seed
seed_status=$?
set -e

if [ "$seed_status" -eq 0 ]; then
  log "Running seed scripts..."
  npm run run-seeds
elif [ "$seed_status" -eq 2 ]; then
  log "Seed data already exists. Skipping seed step."
else
  log "Seed validation failed. Aborting startup."
  exit 1
fi

log "Startup validation completed. Launching application."
exec "$@"
