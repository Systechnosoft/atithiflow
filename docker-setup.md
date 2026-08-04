# AtithiFlow Docker Setup

## Overview
This configuration targets the `Atithiflow.code-workspace` project and includes the `hotel-api` backend, `hotel-ui` frontend, and a local `postgres` database service.

## Files Created
- `docker-compose.yml` – production-ready compose file
- `docker-compose.dev.yml` – local development compose override
- `docker-compose.prod.yml` – production deploy configuration hints
- `hotel-api/Dockerfile` – multi-stage backend image
- `hotel-ui/Dockerfile` – multi-stage frontend image
- `hotel-api/.dockerignore` – backend build context ignore rules
- `hotel-ui/.dockerignore` – frontend build context ignore rules
- `hotel-api/scripts/docker-entrypoint.sh` – backend startup pipeline
- `hotel-api/scripts/startup.sh` – local startup wrapper
- `hotel-api/scripts/validate-env.js` – env validation
- `hotel-api/scripts/validate-deps.js` – dependency validation
- `hotel-api/scripts/validate-db.js` – DB connectivity validation
- `hotel-api/scripts/validate-migrations.js` – migration status validation
- `hotel-api/scripts/run-migrations.js` – migration execution with tracking
- `hotel-api/scripts/validate-seed.js` – seed pre-check
- `hotel-api/scripts/run-seeds.js` – seed execution
- `hotel-api/scripts/healthcheck.js` – container health probe

## Startup Flow
1. Environment validation
2. Dependency validation
3. Database connectivity check
4. Migration validation
5. Migration execution
6. Seed validation
7. Seed execution
8. Application startup

All checks occur before the backend begins serving traffic.

## Build Flow
### Backend
```sh
cd hotel-api
npm ci
docker build -t atithiflow-backend:latest .
```

### Frontend
```sh
cd hotel-ui
npm ci
docker build -t atithiflow-frontend:latest .
```

## Local Setup
Use the development compose stack for local work:
```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Production Setup
Use the production compose files for deploy-ready container behavior:
```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Environment Variables
Required backend variables in `hotel-api/.env`:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `ALLOWED_ORIGINS`

The frontend may require Vite-specific environment variables if the app uses runtime env injection.

## Migration Flow
- Migrations are stored in `hotel-api/migrations`
- A tracking table `public.schema_migrations` is created automatically
- Pending migrations are applied in sorted order
- Drift is detected by checksum and stops startup if migration SQL changed after application

## Seeder Flow
- Seed validation checks for existing `roles` rows
- If data already exists, seeding is skipped with a warning
- If missing, `hotel-api/scripts/seed-master-data.js` is executed

## Health Checks
- Backend readiness: `http://localhost:3000/healthz`
- Database connectivity: `pg_isready`

## Troubleshooting
### Missing environment variable
`[ERROR] Missing environment variable(s):` lists each missing name.

### Database connection failed
Possible causes:
- invalid `DATABASE_URL`
- DB not reachable from container
- SSL misconfiguration

### Migration drift
Occurs when SQL files change after being recorded in `schema_migrations`.
Fix by reconciling migration history and ensuring `migrations/` contains the current sequence.

## CI/CD Compatibility
This setup is compatible with GitHub Actions, GitLab CI, Azure DevOps, and Jenkins by using:
- `docker build`
- `docker compose`
- service healthchecks and non-root container execution

Use the provided `docker-compose.yml` as the base file, then layer `docker-compose.dev.yml` or `docker-compose.prod.yml` for environment-specific behavior.
