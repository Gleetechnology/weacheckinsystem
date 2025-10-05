# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Next.js (App Router, TypeScript) + Prisma ORM (PostgreSQL). Styling via TailwindCSS v4. Uses ExcelJS/XLSX for import/export, ZXing for QR scanning, and qrcode for QR generation. Auth uses JWT.
- Node version: 18 (see package.json engines)
- Notable paths:
  - app/ — UI routes and server route handlers (app/api/**)
  - lib/ — shared server utilities (Prisma client, notifications)
  - prisma/ — schema.prisma and migrations
  - middleware.ts — JWT gate for protected API routes
  - _redirects — copied into .next/_redirects during build

Environment
- Required environment variables (per app/README.md and prisma/schema.prisma):
  - DATABASE_URL
  - DIRECT_URL
  - JWT_SECRET
- For local dev, place them in .env or .env.local (not committed). For deploy (e.g., Netlify), set them in the dashboard. Do not expose actual values in commands.

Install and run
- Install dependencies
  ```bash
  # npm (recommended on this repo)
  npm install
  # or
  yarn install
  # or
  pnpm install
  ```
- Start dev server
  ```bash
  npm run dev
  ```
- Build (generates Prisma client, builds Next.js, copies redirects)
  ```bash
  npm run build
  ```
- Start production server (after build)
  ```bash
  npm start
  ```

Linting
- ESLint config is located at app/eslint.config.mjs. The npm script "lint" is defined as "eslint" without args. To ensure the correct config is used, explicitly pass the config path:
  ```bash
  # Lint UI and server code using the flat config inside app/
  npx eslint --config app/eslint.config.mjs "app/**/*.{ts,tsx}" "lib/**/*.ts"
  ```
- Alternatively, wire the script to include paths in package.json if desired.

Database and Prisma
- Prisma schema: prisma/schema.prisma (PostgreSQL). The build step already runs prisma generate.
- Common commands:
  ```bash
  # Generate Prisma client (run after schema changes)
  npx prisma generate

  # Create a development migration interactively
  npx prisma migrate dev --name <migration_name>

  # Apply pending migrations in production
  npx prisma migrate deploy

  # Inspect data locally
  npx prisma studio
  ```

Testing
- No test runner/configuration detected (e.g., Jest/Vitest) and no test scripts in package.json. Single-test execution is not applicable until a test framework is added.

High-level architecture
- Next.js App Router
  - UI routes under app/** (e.g., /login, /dashboard, /checkin, /settings, /reports, /help-support, /system-status).
  - API routes under app/api/** implemented as server route handlers (route.ts). Key endpoints include:
    - Auth: app/api/auth/login/route.ts — validates admin credentials (bcrypt) and returns a signed JWT.
    - Attendees: app/api/attendees/route.ts — paginated listing with optional status and search filters; parses extraData JSON for dynamic columns.
    - Upload: app/api/upload/route.ts — parses uploaded Excel (XLSX), flexibly maps headers (KR/EN support), generates QR code data URLs, and batch-inserts attendees; emits notifications.
    - Check-in: app/api/checkin/route.ts — validates qrData, marks attendee checked-in, and creates a notification.
    - Admins: app/api/admins/route.ts — list/create/delete admin accounts (passwords hashed with bcrypt).
    - Admin profile: app/api/admin/profile/route.ts — get/update profile, optional password change with current-password verification.
    - Stats: app/api/stats/route.ts — returns total/checked-in/pending counts.
    - Reports: app/api/reports/* — aggregated reporting endpoints (e.g., regions, positions, trends).
    - Downloads/Templates: app/api/download/excel/route.ts (Excel export with embedded QR images), app/api/template/csv/route.ts (template generation).
- Middleware
  - middleware.ts enforces Authorization: Bearer <JWT> on protected API routes via next/server middleware. It also permits some download requests. JWT secret expected in env (JWT_SECRET).
- Server utilities
  - lib/prisma.ts sets up a singleton PrismaClient.
  - lib/notifications.ts wraps Prisma notification operations and provides helpers for common events (upload completion, check-in, etc.).
- Data model (selected)
  - prisma/schema.prisma defines Admin, Attendee (fields include dynamic Excel-derived columns and extraData JSON), Notification, Setting. Datasource urls read from env.

Local development workflow
- Authenticate from UI via /login which calls /api/auth/login to obtain a JWT; the app stores it in localStorage and forwards it in Authorization headers for protected calls.
- Upload attendee spreadsheets from the Dashboard. The server computes headers via fuzzy matching and creates Attendee records with generated QR codes.
- Use /checkin to scan and POST qrData to /api/checkin.
- Download current data via /api/download/excel (UI provides links that can append token via querystring when needed).

Deployment notes
- From app/README.md (Netlify):
  - Build command: prisma migrate deploy && npm run build
  - Publish directory: .next
  - Node version: 18
  - Required env: DATABASE_URL, DIRECT_URL, JWT_SECRET

Gotchas and nuances
- ESLint flat config lives in app/eslint.config.mjs; pass --config when invoking from repo root.
- Build relies on _redirects existing at repo root; package.json copies it into .next/_redirects after build.
- Some middleware paths are matched for protection (see config.matcher in middleware.ts). If you add new protected endpoints, update the matcher accordingly.
