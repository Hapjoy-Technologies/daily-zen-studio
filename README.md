# Daily Zen Studio

Internal scheduling tool for the Gratitude editorial team. Static site that talks to the Daily Zen API Lambda.

## Stack

Next.js 15 (App Router, static export) · TypeScript · MUI v6 (Material 3 theme) · TanStack Query · Zod · Inter via `next/font`. Deploys to GitHub Pages.

## Local setup

```bash
cp .env.local.example .env.local
# edit .env.local and set NEXT_PUBLIC_API_BASE_URL to the Lambda invoke URL
npm install
npm run dev
```

Open <http://localhost:3000>. Enter the editor password to sign in (it's the `EDITOR_PASSWORD` env var on the Lambda).

## Pages

- **/library** — Browse, filter, edit, and add cards in the DynamoDB-backed library.
- **/build** — Plan the next month: 6 ordered slots per day, pick from library or create new. Auto-saves to `localStorage`. Export downloads `<YYYY>_<M>.json`.

## Deploy

Push to `main`. The `.github/workflows/deploy.yml` workflow builds the static export and publishes it to GitHub Pages.

Before the first deploy:

1. **Enable Pages** for the repo in Settings → Pages → Source: GitHub Actions.
2. **Set Actions variables** in Settings → Secrets and variables → Actions → Variables:
   - `NEXT_PUBLIC_API_BASE_URL` — Lambda invoke URL (required).
   - `NEXT_PUBLIC_BASE_PATH` — repo name slug used for `basePath`. Defaults to `daily-zen-studio`; set to an empty string only if you're hosting at a user/org root site or a custom domain.
3. **Tighten Lambda CORS** — once the GH Pages URL is known, set the Lambda's `CORS_ALLOWED_ORIGIN` env var to it (defaults to `*`).
4. **Manifest CDN CORS** — `static.gratefulness.me` must serve `Access-Control-Allow-Origin` for the GH Pages origin (or `*`), otherwise the Past Months page can't fetch published manifests. If you're on S3 + CloudFront, the bucket CORS policy and the CloudFront response-headers policy both need to allow it.

## Data shapes

- **Library card** — DynamoDB row, one per unique card. Shape: see `src/lib/api/types.ts`.
- **Monthly manifest** — `YYYY_M.json` the apps fetch. Keys are `YYYYMMDD_en`, values are 6-entry arrays. Shape: see `src/lib/manifest/types.ts`. Library card → manifest entry conversion lives in `src/lib/manifest/build.ts`.
