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

- `artifacts/api-server` — Express + Drizzle API at `/api`. Uses Clerk (`@clerk/express`) for production auth; `x-user-id` header still works in development for demo tooling. Users are auto-provisioned on first Clerk sign-in (looked up by `clerk_id`, then by email, then created). Clerk proxy middleware at `/api/__clerk`.
- `artifacts/loyalty-web` — React + Vite web app for PointHive loyalty marketplace.
- `artifacts/loyalty-mobile` — Expo React Native app (PointHive Mobile). Uses `@clerk/expo` for authentication with SecureStore session persistence. Real email/password sign-in at `app/login.tsx`, sign-up with email verification at `app/sign-up.tsx`. Uses expo-router, shares the `@workspace/api-client-react` package (calls the same `/api` backend), 4-tab layout (Home/Shop/Inbox/Profile), product detail screen, profile editor, notifications inbox. Seller inventory management: `app/my-listings.tsx` (list/delete own listings, accessible from Profile tab) and `app/edit-listing/[id].tsx` (edit title/description/price/stock, toggle delist/re-list).

### Mobile auth & API client wiring

`app/_layout.tsx` wraps the app in `ClerkProvider` with `tokenCache` from `@clerk/expo/token-cache` (uses SecureStore on native, localStorage on web). `AuthGate` uses Clerk's `useAuth` to detect sign-in state. `setAuthTokenGetter(() => getToken())` from `@workspace/api-client-react` attaches the Bearer token to every API request.

### Mobile auth context

`contexts/AuthContext.tsx` is a thin wrapper around `@clerk/expo`'s `useAuth` and `useClerk` hooks, exposing `{ isSignedIn, isLoaded, signOut }`. All components that used the old demo `userId` now rely on API responses for user data rather than a locally-stored integer ID.

### Database: users table

The `users` table has a `clerk_id` (nullable, unique text) column added alongside the existing integer `id`. The API server maps Clerk user IDs to database integer IDs on each authenticated request, auto-provisioning new rows using the Clerk user's email and name from the Clerk API.

### Mobile preview note

The mobile artifact uses `router = "expo-domain"` and is served at `$REPLIT_EXPO_DEV_DOMAIN`, not the workspace `/mobile/` proxy path. The workspace preview pane and the screenshot tool both use the Expo domain automatically.
