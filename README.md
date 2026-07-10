# stagecraft-frontend

The [StageCraft](https://github.com/StagecraftOps) dashboard — every user-facing surface of the platform lives here.

**Port**: 3000 · **Stack**: Angular 18 (standalone components, signals), Tailwind, served by nginx

> ⚠️ **Repo layout note**: the repo root carries an earlier Next.js scaffold (`src/`, `next.config.js`). **The app that actually builds and ships is `angular-app/`** — the root `Dockerfile` builds `angular-app/` and serves it with nginx on port 3000. Treat the Angular app as the frontend; the Next.js tree is legacy.

## Pages

Dashboard, workflows (+ per-repo detail), runs, dependency graph, analytics, optimization, standardization, governance, vulnerabilities, vulnerability remediation, knowledge graph, Pipeline Chat, Agent Fleet (AI crew), agent runs/audit, application contexts, onboarding, settings — one standalone component each under `angular-app/src/app/pages/`.

All data comes from [stagecraft-api](https://github.com/StagecraftOps/stagecraft-api) (REST + WebSocket for live run updates). The frontend never talks to the worker, the queue, or GitHub directly — with one exception: dispatching a published Custom agent fires a `workflow_dispatch` at the target repo's own remediation workflow via the API.

## What it needs

- **stagecraft-api reachable** — locally the dev server proxies `/api` via `angular-app/proxy.conf.json`; in-cluster, nginx and the shared ALB route `/api` to the API service
- GitHub OAuth happens through the API; the frontend itself needs no GitHub credentials
- `.env.example` at the repo root belongs to the legacy Next.js scaffold — the Angular app is configured via its environment files and the proxy config

## Run locally

```bash
# Dev server with hot reload (recommended)
cd angular-app
npm install
npm start        # ng serve on http://localhost:4200, /api proxied to localhost:8000

# Or the production build, as shipped
docker compose up --build   # nginx serving the built app on http://localhost:3000
```

Tests: `cd angular-app && npm test`

## Deployment

Built and shipped as the nginx image from the root `Dockerfile`; deployed by [stagecraft-helm](https://github.com/StagecraftOps/stagecraft-helm)'s `frontend` chart behind the shared ALB (catch-all `/`, with `/api` routed to the API).
