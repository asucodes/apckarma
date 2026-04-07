# TnP Karma — Complete Project Overview

**Internal tool for the Training & Placement Cell to gamify and track volunteer hours.**
Live at `https://tnpkarma.1petaflop.tech` • Built by Ashirvad

---

## What It Does (The Elevator Pitch)

TnP Karma is a gamified volunteer-hour tracker for T&P cell volunteers. Volunteers log their hours for placement drives/company visits, admins approve them, and peers can witness or flag each other's activity. Everything is ranked on a karma leaderboard.

**The core loop:**
1. Admin creates an **Event** (e.g. "BPCL Campus Visit")
2. Volunteers **log hours** against that event (within 3-day window)
3. Logs are **pending** until an admin approves or rejects them
4. Approved logs appear on the public **Feed**, where other volunteers can **witness** (upvote) or **flag** (downvote) them
5. Everything rolls up into a **Leaderboard** — ranked by Karma, Events, Hours, or Witnesses

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Frontend** | React 19, vanilla CSS (934 lines) |
| **Auth** | JWT tokens + bcrypt password hashing, stored in HTTP-only cookies |
| **Database** | Google Sheets via `googleapis` — zero cost, headless |
| **Server** | Ubuntu Linux droplet on `1petaflop.tech` |
| **Proxy** | Nginx reverse proxy → `localhost:3000` |
| **Domain** | `tnpkarma.1petaflop.tech` (Let's Encrypt SSL via certbot) |

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Client (React 19 App Router)                              │
│                                                            │
│  ┌──────────┐ ┌──────┐ ┌──────┐ ┌─────────┐ ┌──────────┐  │
│  │Leaderboard│ │ Feed │ │ Log  │ │ Profile │ │  Admin   │  │
│  │  (page)   │ │(page)│ │(page)│ │ (page)  │ │  (page)  │  │
│  └──────────┘ └──────┘ └──────┘ └─────────┘ └──────────┘  │
│         ↕          ↕        ↕         ↕           ↕        │
├────────────────────────────────────────────────────────────┤
│  API Routes (Next.js Route Handlers)                       │
│                                                            │
│  /api/auth/*     → login, signup, logout, me               │
│  /api/log        → submit a log entry                      │
│  /api/logs       → get all logs (cached)                   │
│  /api/leaderboard→ aggregated karma rankings               │
│  /api/events     → list events                             │
│  /api/companies  → unique company names                    │
│  /api/volunteers → hardcoded volunteer roster              │
│  /api/upvote     → witness (upvote) a log                  │
│  /api/downvote   → flag (downvote) a log                   │
│  /api/admin/*    → approve, reject, create-event,          │
│                    manual-log, reset-password, logs         │
├────────────────────────────────────────────────────────────┤
│  lib/sheets.js   → Google Sheets read/write + 30s cache    │
│  lib/auth.js     → JWT sign/verify, bcrypt, admin check    │
├────────────────────────────────────────────────────────────┤
│  Google Sheets (3 tabs)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Logs:   Timestamp|Name|Roll|Company|Hours|Up|Down|  │   │
│  │         Status|Approver                             │   │
│  │ Users:  RollNumber|Name|PasswordHash|Role|CreatedAt │   │
│  │ Events: Name|CreatedAt|CreatedBy                    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Pages & Features

### 1. Leaderboard (`/` — [page.js](file:///d:/projects/tnpkarma/app/page.js))
- Default landing page — the karma rankings
- **4 sortable tabs**: Karma, Events, Hours, Witnessed
- Click to expand any row and see individual log entries
- Gold/Silver/Bronze rank badges for top 3
- Karma formula: **`hours × 10 + unique_events × 50`**
- Only approved, non-disputed logs count

### 2. Feed (`/feed` — [page.js](file:///d:/projects/tnpkarma/app/feed/page.js))
- Reddit-style feed of all approved activity
- **Witness system**: Click the eye icon if you were at the same event → boosts credibility
- **Flag system**: Flag if you were there and didn't see someone → if `net_flags ≤ -3`, the log is "disputed" (struck through, excluded from leaderboard)
- Witness/flag state persisted in `localStorage`
- Dismissable info banner explaining witness vs flag

### 3. Log Hours (`/log` — [page.js](file:///d:/projects/tnpkarma/app/log/page.js))
- Authenticated-only page to submit volunteer hours
- Dropdown of **open events** (admin-created, auto-close after 3 days)
- Hour input (0.5–24, step 0.5)
- Submissions are **pending** until admin approval
- "What's New" collapsible section
- Footer with manager contact (WhatsApp + Discord)

### 4. Profile (`/profile` — [page.js](file:///d:/projects/tnpkarma/app/profile/page.js))
- Shows the logged-in volunteer's own logs
- Each log shows: company, time ago, hours, and approval status badge (Pending / Approved / Rejected + approver name)
- Redirects to `/login` if not authenticated

### 5. Admin Dashboard (`/admin` — [page.js](file:///d:/projects/tnpkarma/app/admin/page.js))
- Protected: only users with `role: admin` can access
- **Approver identity prompt**: "Who is approving today?" — stored in `sessionStorage`
- **Create Event**: text input to create a new event (saved to Events sheet)
- **Recent Events & Logs**: grouped by event, expandable
  - Each log shows volunteer name, roll, hours, time ago
  - Approve ✓ / Reject ✕ buttons with approver tracking
  - Pending count badge
- **Rapid Entry Log**: admin can log hours directly for any volunteer from a dropdown, against any open event
- **Password Reset**: admin can reset any student's password

### 6. Login (`/login` — [page.js](file:///d:/projects/tnpkarma/app/login/page.js))
- Roll number + password login
- "Remember me for 30 days" checkbox (extends JWT expiry from 1d → 30d)
- Admin login via env-configured `ADMIN_ID` + `ADMIN_PASSWORD`
- Redirects admin → `/admin`, volunteer → `/`

### 7. Signup (`/signup` — [page.js](file:///d:/projects/tnpkarma/app/signup/page.js))
- Dropdown of the 42-person volunteer roster (can't sign up if name isn't in the list)
- Auto-fills roll number from selection
- Password set + confirm (min 6 chars)
- Creates user row in Users sheet

---

## Shared Components

| Component | What it does |
|---|---|
| [BottomNav.js](file:///d:/projects/tnpkarma/app/components/BottomNav.js) | 4-tab bottom nav (Board, Log, Feed, My Logs) + conditional Admin tab with pending badge. Hidden on auth pages. |
| [AuthHeader.js](file:///d:/projects/tnpkarma/app/components/AuthHeader.js) | Shows logged-in username + logout button in header. Redirects to `/login` if no session. |
| [ThemeToggle.js](file:///d:/projects/tnpkarma/app/components/ThemeToggle.js) | Light/dark mode toggle in top-right corner |
| [SplashScreen.js](file:///d:/projects/tnpkarma/app/components/SplashScreen.js) | 3-second branded splash with pulsing cat mascot on initial load |

---

## Backend (lib/)

### [sheets.js](file:///d:/projects/tnpkarma/lib/sheets.js) — The "Database"
- All data lives in a **Google Sheet** with 3 tabs: [Logs](file:///d:/projects/tnpkarma/lib/sheets.js#106-136), `Users`, [Events](file:///d:/projects/tnpkarma/lib/sheets.js#227-238)
- Google Service Account auth via `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`
- **In-memory caching** with 30s TTL (`logsCache`, `eventsCache`, `usersCache`) — invalidated on any write
- Key functions:
  - [getLogs()](file:///d:/projects/tnpkarma/lib/sheets.js#106-136) — reads + maps all log rows, parses multiple date formats (Indian DD/MM/YYYY, short "4 Feb", ISO)
  - [getLeaderboardData()](file:///d:/projects/tnpkarma/lib/sheets.js#149-194) — aggregates logs into per-volunteer karma scores
  - [getUser()](file:///d:/projects/tnpkarma/lib/sheets.js#197-206) / [createUser()](file:///d:/projects/tnpkarma/lib/sheets.js#207-217) / [updateUserPassword()](file:///d:/projects/tnpkarma/lib/sheets.js#218-224) — user CRUD
  - [getEvents()](file:///d:/projects/tnpkarma/lib/sheets.js#227-238) / [createEvent()](file:///d:/projects/tnpkarma/lib/sheets.js#239-249) / [isEventOpen()](file:///d:/projects/tnpkarma/lib/sheets.js#250-257) — event management with 3-day TTL
- Hardcoded **42 volunteers** in `VOLUNTEERS` array (used for signup validation + admin rapid entry)

### [auth.js](file:///d:/projects/tnpkarma/lib/auth.js) — Authentication
- JWT with configurable secret (`JWT_SECRET` env)
- Cookie name: `tnpkarma_session`
- Bcrypt hashing (10 rounds)
- Admin is a special case: plaintext password comparison against `ADMIN_PASSWORD` env var
- [getSession()](file:///d:/projects/tnpkarma/lib/auth.js#41-48) reads JWT from cookies server-side

---

## API Routes (10 groups, ~15 endpoints)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/login` | POST | No | Authenticate user or admin, set JWT cookie |
| `/api/auth/signup` | POST | No | Create account (must be in volunteer roster) |
| `/api/auth/logout` | POST | Yes | Clear session cookie |
| `/api/auth/me` | GET | Yes | Return current user info from JWT |
| `/api/log` | POST | Yes | Submit a new log (pending approval) |
| `/api/logs` | GET | No | Get all logs (cached, newest first) |
| `/api/leaderboard` | GET | No | Aggregated karma rankings |
| `/api/events` | GET | No | List all events |
| `/api/companies` | GET | No | Unique company names from logs |
| `/api/volunteers` | GET | No | Return the 42-person roster |
| `/api/upvote` | POST | No | Witness (increment upvote on a log) |
| `/api/downvote` | POST | No | Flag / unflag (increment/decrement downvote) |
| `/api/admin/pending` | GET | Admin | Get count of pending logs |
| `/api/admin/approve` | POST | Admin | Approve a log + record approver name |
| `/api/admin/reject` | POST | Admin | Reject a log + record approver name |
| `/api/admin/create-event` | POST | Admin | Create a new event |
| `/api/admin/manual-log` | POST | Admin | Log hours for any volunteer directly |
| `/api/admin/reset-password` | POST | Admin | Reset a student's password |
| `/api/admin/logs` | GET | Admin | Get all logs (bypasses cache) |

---

## Design System

- **934 lines** of vanilla CSS in [globals.css](file:///d:/projects/tnpkarma/app/globals.css)
- **Old Reddit aesthetic**: squarish borders (`border-radius: 4px`), dense layout, tight typography
- **Light + Dark themes** with CSS custom properties, toggled via `data-theme="dark"` on `<html>`
- **Accent color**: `#ff4500` (Reddit orange)
- **Mobile-first**: max-width 600px content area, bottom nav, 16px font on mobile inputs to prevent iOS zoom
- Custom scrollbar, toast notifications, animated splash screen, feed cards with vote sidebar

---

## Scripts

| Script | Purpose |
|---|---|
| [import-data.mjs](file:///d:/projects/tnpkarma/scripts/import-data.mjs) | One-time CSV → Google Sheets import for historical data |
| [keep-bpcl.mjs](file:///d:/projects/tnpkarma/scripts/keep-bpcl.mjs) | Data cleanup: keep only BPCL-related entries |
| [migrate-status.mjs](file:///d:/projects/tnpkarma/scripts/migrate-status.mjs) | Migration: add Status/Approver columns to existing logs |
| [gen-hash.js](file:///d:/projects/tnpkarma/scripts/gen-hash.js) | Generate bcrypt hashes for testing |
| [test-api.js](file:///d:/projects/tnpkarma/scripts/test-api.js) | API smoke test |
| [test-sheets.mjs](file:///d:/projects/tnpkarma/scripts/test-sheets.mjs) | Verify Google Sheets connection works |

---

## Deployment

- **Server**: Ubuntu Linux droplet
- **Process**: `next build && next start` on port 3000
- **Proxy**: Nginx at `tnpkarma.1petaflop.tech` → `localhost:3000`
- **SSL**: Let's Encrypt via certbot (auto-managed by Nginx)
- **Env vars** ([.env.local](file:///d:/projects/tnpkarma/.env.local)):
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — Google SA for Sheets API
  - `GOOGLE_PRIVATE_KEY` — SA private key
  - `GOOGLE_SHEETS_SPREADSHEET_ID` — production sheet
  - `GOOGLE_SHEETS_SPREADSHEET_ID_TEST` — dev sheet (used when `NODE_ENV=development`)
  - `JWT_SECRET`
  - `ADMIN_ID` — admin login username 
  - `ADMIN_PASSWORD` — admin login password

---

## Stats

- **42 volunteers** in the roster
- **~2,800 lines** of application code (pages + components + lib + APIs)
- **934 lines** of CSS
- **Next.js 15** + **React 19** (latest stack)
- **Zero external UI libraries** — fully custom
- **$0 database cost** — Google Sheets as headless DB

---

## What Made It a Hit

1. **Gamification**: Karma points, leaderboard tiers, peer witnessing — volunteers actually competed
2. **Peer accountability**: The witness/flag system created natural social pressure against fake logging
3. **Low friction**: Mobile-first bottom nav, splash screen, 3-tap logging flow
4. **Admin power tools**: Rapid entry, batch approve/reject, approver tracking
5. **The cat mascot** 🐱: Branded identity that stuck ([cat.png](file:///d:/projects/tnpkarma/public/cat.png) splash screen)
6. **Old Reddit aesthetic**: Dense, fast, no-nonsense — felt like a tool, not a toy
