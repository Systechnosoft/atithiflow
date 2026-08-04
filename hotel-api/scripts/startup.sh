#!/usr/bin/env sh
set -e

printf "[INFO] Starting AtithiFlow backend startup script...\n"

cd "$(dirname "$0")"/..
sh ./scripts/docker-entrypoint.sh npm start
