## Prompt

You're building the internal **Daily Zen scheduling tool** for the Gratitude team. It's not a public site — it's a password-gated webpage the editorial team uses to plan the Daily Zen content the iOS and Android apps show each day.

### What Daily Zen is

The Gratitude app surfaces a small batch of cards every day under "Daily Zen": a Quote of the Day, an Affirmation, a "Think this instead of that" reframe, a Spread Gratitude thank-you, a curated Blog post, and a Gratitude story (6 cards per day). The cards come from a curated library that the editorial team has built up since 2021 — ~4,700 unique cards, where many quotes/affirmations have been reused across multiple dates.

### Audience

**Internal editorial team only.** Everyone who enters the site uses the same shared password — there are no public visitors and no per-user accounts. Treat the whole webpage as a private, behind-the-password admin tool.

### The four pages

1. **Login** — single-page password gate. Validates the password by making one authenticated call to the API; on success stores it in `sessionStorage` (cleared on tab close). All other pages require this.
2. **View Library** — browse the ~4,700 unique cards in the DynamoDB-backed library. Filter by theme, author, status; search by text. Each card is editable inline (PATCH); deletion is also supported but should require a confirm.
3. **Build Next Month** — the headline workflow. The team plans the upcoming month by assigning 6 cards to each day. For every slot they either **pick an existing card from the library** (with search/filter) or **create a brand-new card** (which also gets saved into the library so it can be reused later). Output: a monthly manifest JSON file ready to ship to the apps (see schema below).
4. **View Past Months** — browse historical month manifests. Already in the database repo at `2026_2.json` → `2026_5.json` (Feb–May 2026); earlier months may also be available. Read-only — past months don't get retrofitted.

### Two related data shapes

There are *two* JSON shapes you'll be working with — keep them straight.

**(A) Library card** — the unique-card library backing DynamoDB. This is what `GET /cards/{cardId}` returns and what `POST /cards` accepts.

```json
{
  "cardId": "802191d7-f93f-42a4-8252-04af75f8db94",
  "theme": "Quote",
  "themeTitle": "Quote of the Day",
  "type": "quote",
  "dzType": "share",
  "status": "active",
  "text": "The beginning is the most important part of the work.",
  "author": "Plato",
  "articleUrl": null,
  "latestBgImageUrl": "https://static.gratefulness.me/daily-zen-bgimages/exp/dz_bg_1.jpg",
  "latestDzImageUrl": "https://static.gratefulness.me/daily-zen-bgimages/exp/quote_1693.png",
  "primaryCTAText": "Share With Friends",
  "sharePrefix": "Here's a beautiful quote...",
  "firstUsedOn": "2026-02-01",
  "lastUsedOn": "2026-02-01",
  "usageCount": 1,
  "usageHistory": ["2026-02-01"]
}
```

Notes on the library card:
- `theme` is one of: **Quote, Affn, Think this instead of that, Spread Gratitude, Blog post, Gratitude stories, Dose of Motivation** (last is retired — `status: "retired"`, hidden from monthly builder by default).
- `latestDzImageUrl` is the card foreground graphic; `latestBgImageUrl` is the background gradient. Compose them for the visual.
- `articleUrl` is populated for Blog post / Gratitude stories only.
- `usageHistory` lists ISO dates (`YYYY-MM-DD`) the card has appeared on. Surface this in the library view ("Used N times — last on YYYY-MM-DD") so the editor can spot recently-used cards and avoid double-booking.
- Counts by theme: Quote 922, Affn 980, Think 645, Spread 708, Blog 417, Stories 399, Motivation 612 (retired).

A full local copy of the library (~4 MB JSON, same shape) lives at `/Users/divijgupta/Documents/Dev/Gratitude/daily-zen-database/daily-zen-cards.json`.

**(B) Monthly manifest** — the per-day card schedule the apps actually fetch. One file per month named `<YYYY>_<M>.json`. Top-level keys are `YYYYMMDD_en`; each value is the ordered list of 6 cards shown that day.

```json
{
  "20260201_en": [
    {
      "theme": "Quote",
      "themeTitle": "Quote of the Day",
      "type": "quote",
      "dzType": "share",
      "language": "en",
      "text": "The beginning is the most important part of the work.",
      "author": "Plato",
      "articleUrl": "",
      "uniqueId": "802191d7-f93f-42a4-8252-04af75f8db94",
      "bgImageUrl": "https://static.gratefulness.me/daily-zen-bgimages/exp/dz_bg_1.jpg",
      "dzImageUrl": "https://static.gratefulness.me/daily-zen-bgimages/exp/quote_1693.png",
      "primaryCTAText": "Share With Friends",
      "sharePrefix": "Here's a beautiful quote from my Gratitude app to brighten your day 😇 https://links.gratefulness.me/DailyZen"
    },
    { "theme": "Spread Gratitude", ... },
    { "theme": "Think this instead of that", ... },
    { "theme": "Blog post", ... },
    { "theme": "Gratitude stories", ... },
    { "theme": "Affn", ... }
  ],
  "20260202_en": [ ... ]
}
```

The 6 cards per day are in this fixed order: **Quote → Spread Gratitude → Think this instead of that → Blog post → Gratitude stories → Affn**. The Dose of Motivation theme is retired and is NOT included in new months.

Field mapping from library card → manifest entry when reusing an existing card:
- library `cardId` → manifest `uniqueId`
- library `latestBgImageUrl` → manifest `bgImageUrl`
- library `latestDzImageUrl` → manifest `dzImageUrl`
- all other shared fields keep the same name; add `language: "en"`.

Example past-month files already live in the database repo: `2026_2.json` through `2026_5.json`. Read one for a complete reference.

### The API

One AWS Lambda behind API Gateway HTTP API. All endpoints return JSON.

**Base URL**: ask the user for the deployed invoke URL — looks like `https://<id>.execute-api.<region>.amazonaws.com`.

**Reads — no auth:**

```
GET /cards/{cardId}                              → 200 { ...card }
GET /cards?theme=Quote&limit=50&cursor=...       → 200 { items: [...], cursor: "..." | null, count: N }
GET /cards?author=Plato&limit=50                 → uses ByAuthorRecency GSI
GET /cards?status=active                         → scan + filter
GET /themes                                      → 200 { themes: [{ theme, count }, ...] }
GET /authors                                     → 200 { authors: [{ author, count }, ...] }
GET /stats                                       → 200 { total, byTheme: {...}, byStatus: {...} }
```

`/cards` supports cursor pagination — pass the previous response's `cursor` back as `?cursor=...`. Default `limit` 50, max 200.

**Writes — require `X-Editor-Password: <password>` header:**

```
POST   /cards               → 201 { ...new card }       body: { theme, text, author?, ... }
PATCH  /cards/{cardId}      → 200 { ...updated card }   body: any subset of editable fields; null REMOVES
DELETE /cards/{cardId}      → 204 (no body)
POST   /cards/bulk          → 200 { updated: [ids], missing: [ids] }
                              body: { cardIds: [...up to 500], patch: { ...fields } }
```

Editable fields: `theme, themeTitle, type, dzType, status, text, author, articleUrl, latestBgImageUrl, latestDzImageUrl, primaryCTAText, sharePrefix, firstUsedOn, lastUsedOn, usageCount, usageHistory`.

`POST /cards` auto-generates `cardId` (uuid4), sets `firstUsedOn`/`lastUsedOn` to today, `usageCount` to 1.

The password is a shared static string set as an env var on the Lambda. **Do not bake it into client code.** Editor flow: a login modal prompts for it, you store it in `sessionStorage`, and your fetch helper attaches it to write requests only.

The Lambda source is readable at `/Users/divijgupta/Documents/Dev/Gratitude/daily-zen-database/lambda/handler.py` if you need to confirm any response shape.

### Brand & theme reference

Extracted from the Gratitude Android app's Material 3 theme files:

**Primary palette** (rose/pink — the brand):
- `primary`: `#EA436B`  •  `onPrimary`: `#FFFFFF`
- `primaryContainer` light: `#FFD9DD`  •  dark: `#910034`
- `onPrimaryContainer` light: `#400012`  •  dark: `#FFD9DD`
- `inversePrimary` light: `#FFB2BC`  •  dark: `#B71849`

**Secondary** (mauve / dusty rose):
- `secondary` light: `#76565A`  •  dark: `#E5BDC1`
- `secondaryContainer` light: `#FFD9DD`  •  dark: `#5C3F43`

**Tertiary** (warm tan / brown):
- `tertiary` light: `#785831`  •  dark: `#EABF8F`
- `tertiaryContainer` light: `#FFDDB8`  •  dark: `#5E411C`

**Surfaces**:
- Background light: `#FFFBFF`  •  dark: `#201A1B`
- Surface light: `#FFF8F7`     •  dark: `#181212`
- Surface container low: `#FEF1F1` / `#201A1B`
- Surface container high: `#F2E5E5` / `#2F2829`

**Error**: `#BA1A1A` (light) / `#FFB4AB` (dark)

**Typography** — use **Inter** for everything (the entire Material 3 type scale below). No secondary display font in v1; if a brand serif is ever wanted later, the Android stack uses Recoleta SemiBold (commercial) with Domine as the free Google Fonts fallback.

| Style | Size / line / weight |
|---|---|
| displayLarge   | 57 / 64 / SemiBold |
| displayMedium  | 45 / 52 / SemiBold |
| displaySmall   | 36 / 44 / SemiBold |
| headlineLarge  | 32 / 40 / SemiBold |
| headlineMedium | 28 / 36 / SemiBold |
| headlineSmall  | 24 / 32 / SemiBold |
| titleLarge     | 22 / 28 / SemiBold |
| titleMedium    | 16 / 24 / SemiBold |
| titleSmall     | 14 / 20 / SemiBold |
| bodyLarge      | 16 / 24 / Regular  |
| bodyMedium     | 14 / 20 / Regular  |
| bodySmall      | 12 / 16 / Regular  |
| labelLarge     | 14 / 20 / SemiBold |
| labelMedium    | 12 / 16 / SemiBold |
| labelSmall     | 11 / 16 / SemiBold |

**Design system** — **Material 3** on the web. Mirror the same visual language the Gratitude Android app uses: M3 elevation, M3 state layers, M3 color roles (primary / secondary / tertiary / surface containers as listed above), M3 typography scale, M3 shape (rounded corners — small 4px, medium 12px, large 16px, extra-large 28px). Component choice is up to you (see tech stack below).

**Use the rose pink (`#EA436B`) sparingly** — it's the accent for CTAs, active states, and small affordances. The canvas should be light surface (`#FFF8F7`) with generous whitespace. The tool should feel calm and on-brand, but it's an internal utility — utility comes first.

### Functional requirements (v1)

**Login (Page 1)**

- Single password input. Submit triggers a test call against the API (e.g. `GET /stats` with the header) to validate. On success, persist password in `sessionStorage` and redirect to the dashboard. On failure, show an inline error.
- "Sign out" anywhere → clears `sessionStorage`, returns here.

**View Library (Page 2)**

- Table or grid of every library card.
- Filter chips: theme (multi-select), status (active / retired), author (autocomplete from `/authors`), text search (client-side substring is fine).
- Sort options: most recently used, least recently used, most used, alphabetical.
- Each row shows: theme chip, text (truncated), author, last-used date, usage count, a thumbnail of `latestDzImageUrl`.
- Click a row → side drawer or full page with the card's full content + editable form (PATCH on save) + Delete button (with confirm).
- "+ New card" CTA at the top → opens the same form blank → POST on save.

**Build Next Month (Page 3)** — the headline feature

- Top-level: pick the target month. Default to the *first month* that isn't already present in the past-months store (e.g. if `2026_5.json` is the latest in the past-months store, default to June 2026).
- Layout: calendar-style grid of days for the chosen month. Each day shows 6 slots in the fixed theme order (Quote → Spread Gratitude → Think Better → Blog → Story → Affn). Empty slots show a "pick a card" button.
- Clicking a slot opens a picker:
   - **Tab 1 — Library**: a filtered list of cards matching that slot's theme. Defaults to "least recently used" so the team rotates content. Show usage count + last-used date prominently. Click to assign.
   - **Tab 2 — Create new**: an inline form with all the required fields (theme is locked to the slot's theme). Submit → POST `/cards` → assign the newly-created card to the slot.
- Auto-save the in-progress month draft to `localStorage` keyed by month so a refresh doesn't lose work.
- "Export month" button (top right): produces the monthly manifest JSON (schema above) and triggers a download as `<YYYY>_<M>.json`. (Where this file gets deployed to the apps after that is out of scope — ask the user; for v1 the team downloads it and ships it via their existing process.)
- Sanity checks before export: warn if any slot is empty, warn if the same library card appears more than once in the month (the manifest accepts it, but it's almost always a mistake).

**View Past Months (Page 4)**

- List of months that already have manifests, newest first.
- Click a month → calendar view of that month with the assigned cards shown read-only. No editing.
- Source of past manifests: ask the user (likely either S3, fetched at runtime, or the database repo at `2026_*.json`). For v1, statically bundle the existing files (Feb–May 2026) and surface them as a stub; production data source can be wired in later.

**Out of scope for v1**

- Per-user accounts (the shared password is the whole auth model)
- Image upload (image URLs are pasted in as strings; assets live on `static.gratefulness.me/daily-zen-bgimages/exp/` and are managed separately)
- Versioning / audit log of edits
- Authoring tools for next year's bulk batch (each month is its own task)
- i18n (English only)

### Tech stack — default recommendation (confirm with user)

- **Next.js 15** (App Router) + **TypeScript**
- **Material 3** as the design system. For React, the highest-fidelity choice is **MUI v6** with the Material 3 theme — it gives you M3 components (Button, TextField, Card, Chip, Drawer, DataGrid…) out of the box, themed with the color roles and typography scale above. Alternative: **Tailwind + shadcn/ui** with manual M3 tokens — more work to match M3 specifically, but lighter and more flexible.
- **TanStack Query** for API calls (caching, retries, optimistic updates for editor actions)
- **Zod** for type-safe parsing of API responses (mirror the library card + manifest schemas above)
- **Vercel** for hosting (free tier, push-to-deploy)
- Load **Inter** via `next/font` from Google Fonts — use it across the whole M3 type scale (no secondary font)

Keep it lean. Editor password lives in `sessionStorage`; TanStack Query handles all data state — no Redux / Zustand needed.

### Repo

The API and dataset already live in a separate repo at `/Users/divijgupta/Documents/Dev/Gratitude/daily-zen-database/`. The webpage should live in its **own repo** (e.g. `daily-zen-web`) — different deploy target, different lifecycle, different CI. Confirm the directory with the user before scaffolding.

### First steps for you

1. Acknowledge that you understand the scope by summarizing the 4 pages and the two data shapes (library card vs monthly manifest) in your own words.
2. Ask the user:
   - **Tech stack** — Next.js + TS + Tailwind + shadcn/ui, or a different preference?
   - **Repo location** — where to scaffold (path? new GitHub repo, or local-only for now)?
   - **API base URL** — the deployed Lambda's HTTP API URL.
   - **Editor password** — they'll enter it at runtime; don't bake it into the repo.
   - **Past-months source** — where to load `2026_*.json` and earlier manifests from in production? (For v1, bundling the existing 4 files statically is fine.)
   - **Manifest delivery** — once a month is exported, where does the JSON go to be picked up by the apps? (Just a download for v1 is OK; ask if they want an automatic S3 upload later.)
   - **MUI vs Tailwind+shadcn** — both can hit Material 3; MUI is higher fidelity out of the box, shadcn is lighter. Pick one.
3. Once those are answered, scaffold the project, set up the theme tokens (colors + typography above), wire up a typed API client that always attaches `X-Editor-Password` from `sessionStorage`, and start with Login → View Library. Build the monthly-build flow next; it's the most complex.

Build for the team, not for show. The View Library and Build Next Month pages should be efficient and dense — they're tools the editors use repeatedly. Respect their time: keyboard navigation, fast filters, no fluff. The aesthetic can still be warm and on-brand, but utility comes first.
