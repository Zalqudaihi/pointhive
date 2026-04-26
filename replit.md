# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Express + Drizzle API at `/api`. Header-based dev auth via `x-user-id` (set by clients).
- `artifacts/loyalty-web` — React + Vite web app for PointHive loyalty marketplace.
- `artifacts/loyalty-mobile` — Expo React Native app (PointHive Mobile). Uses expo-router, shares the `@workspace/api-client-react` package (calls the same `/api` backend), 4-tab layout (Home/Shop/Inbox/Profile), product detail screen, profile editor, notifications inbox. Demo identity picker on `/login` (no Clerk per user). Dev-only `?demoUserId=N` URL param auto-signs-in for screenshot/test previews; gated behind `__DEV__`.

### Mobile API client wiring

`app/_layout.tsx` calls `setBaseUrl()` and `setUserIdGetter(() => getCurrentUserIdHeader())` from `@workspace/api-client-react` so every request carries `x-user-id` header. The `setUserIdGetter` helper was added to `lib/api-client-react/src/custom-fetch.ts`.

### Mobile preview note

The mobile artifact uses `router = "expo-domain"` and is served at `$REPLIT_EXPO_DEV_DOMAIN`, not the workspace `/mobile/` proxy path. The workspace preview pane and the screenshot tool both use the Expo domain automatically.
