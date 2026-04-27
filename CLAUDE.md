# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (defaults to localhost:3000, use --port to change)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint check
```

No test scripts configured. Deploy with `vercel --prod`, then alias with `vercel alias set <url> seedupdevs.vercel.app`.

## Architecture

Platform for the SeedUp Devs developer community. Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and Framer Motion. Language: Spanish (`lang="es"`).

**Routes:**
- `/` — Landing page
- `/evaluacion` — Technical evaluation (15 questions, stateless)
- `/resultado` — Results + registration + Discord OAuth flow
- `/dashboard` — User progress dashboard (level, history, feedback, plan badge, recommendations)
- `/learning` — Learning paths catalog
- `/learning/[pathId]` — Path detail with modules and lesson list
- `/lesson/[id]` — Lesson viewer with markdown + progress tracking
- `/pricing` — Free vs Pro pricing page
- `/billing` — Subscription management (Stripe portal)
- `/admin` — Admin panel (protected, `is_admin = true` required)
- `/admin/teams` — Team management: view/create teams, assign pending applicants
- `/admin/community` — Community automation dashboard (engagement stats, top users, cron event log)
- `/admin/feedback` — Feedback viewer (filterable by star rating)
- `/admin/learning-paths` — Learning path CRUD + seed button
- `/admin/modules` — Module CRUD for a given path (path_id via query param)
- `/admin/lessons` — Lesson CRUD + markdown editor with preview (module_id via query param)

**Path alias:** `@/*` → `src/*`

---

### Landing page (`src/app/page.tsx`)

```
CircuitBackground  ← animated SVG, fixed behind everything
Navbar             ← scroll-aware glass header; shows "Mi progreso" link if seedup_registro_email is in sessionStorage
HeroSection        ← custom cursor, mouse spotlight, floating particles
LandingContent     ← all sections (About, Features, Community, Projects, etc.) — all sub-components live inside this single file
Footer
```

**Styling** (`src/app/globals.css`): Tailwind CSS 4 (PostCSS, no `tailwind.config.js`). Color palette via CSS custom properties: `--primary: #00E0FF`, `--background: #05070D`, `--accent: #1E90FF`. Utility classes: `.glass`, `.glass-card`, `.btn-glow`, `.glow-text`, `.animate-float`, `.animate-pulse-glow`. Dark-only design.

---

### Evaluation system

**Data flow:**
1. `/evaluacion` — selects 15 questions from `src/data/preguntas.ts` (100 total), stratified: 3 per level (`dev-zero`→`dev-platinum`), randomized per session via `useState` lazy initializer.
2. `POST /api/evaluar` — receives `{ respuestas, preguntaIds }`. Filters to active IDs, scores per-level in cascade: `UMBRAL_NIVEL = 2` (need ≥2/3 correct per level to pass it). `nivelFinal` = highest consecutive level cleared. Returns `ResultadoEvaluacion` (stored in `sessionStorage['seedup_resultado']`).
3. `/resultado` — reads sessionStorage, shows score + level badge + strengths/weaknesses + `RegisterForm` + `FeedbackForm` (in success state).

**Level hierarchy** (defined in `src/lib/niveles.ts`):
`dev-zero < dev-bronce < dev-silver < dev-gold < dev-platinum`

`src/lib/niveles.ts` exports: `NIVEL_ORDER` (ordered array), `ROLE_MAP` (nivel → Discord role env var), `nivelIndex(nivel)` (numeric rank), `isUpgrade(current, new)` (true if new > current or current is null). Single source of truth used by Discord callback, update-level, and admin override.

**Evaluation state** (`src/hooks/useEvaluacion.ts`): `useReducer`-based hook wrapping navigation (SIGUIENTE/ANTERIOR), answer storage (SET_RESPUESTA), and submit flags (SET_ENVIANDO/SET_ERROR). Returns `dispatch` for direct action dispatch from the page (e.g. `SET_ENVIANDO` before fetch). Does not handle API calls — that stays in the page component.

**Key types** (`src/types/evaluacion.ts`): `Nivel`, `Habilidad`, `Pregunta`, `RespuestaUsuario`, `ResultadoEvaluacion`.

**`EvaluationDisclaimerModal`** (`src/components/evaluacion/EvaluationDisclaimerModal.tsx`) — shown before the first question. Traps focus and locks scroll. Persists acceptance in sessionStorage (`seedup_eval_disclaimer_seen` for anonymous, `seedup_eval_disclaimer_seen_<email>` for registered users). Cannot be dismissed with Escape — user must click the accept button.

---

### Registration + progression

**`POST /api/save-user`** — central endpoint called after evaluation:
- If email already in DB: skips name/phone validation, just saves evaluation.
- If new user: requires all fields (`nombres`, `apellidos`, `email`, `telefono`). Also sends welcome email via Resend and logs to `communications_log`.
- Always: inserts into `evaluations`, calls `applyLevelUpdate()`, returns `{ ok, upgraded, previous_level, new_level, total_evaluaciones }`.

**`applyLevelUpdate(userId, newNivel)`** (`src/app/api/update-level/route.ts`):
- Exported for internal use by `save-user`.
- Updates `users.current_level` only if `newNivel > current_level` (no downgrade).
- Inserts into `progress_logs` on upgrade.
- If user has `discord_id`: removes old Discord role, assigns new one.

**`POST /api/update-level`** — same logic exposed as an independent endpoint for future use (Discord bot, admin tools).

---

### sessionStorage keys (client-side state machine)

| Key | Set when | Cleared when |
|---|---|---|
| `seedup_resultado` | Evaluation completes | User starts new test |
| `seedup_registro_email` | save-user succeeds | Never (persists across sessions) |
| `seedup_eval_saved` | save-user succeeds | `handleFinalizar` in `/evaluacion` (new test) |
| `seedup_eval_disclaimer_seen` | Disclaimer accepted (anon or registered) | Never |
| `seedup_eval_disclaimer_seen_<email>` | Disclaimer accepted while email in storage | Never |

**Returning user flow** (email in sessionStorage, `seedup_eval_saved` NOT set): `RegisterForm` auto-calls `save-user` on mount with only `{ email, resultado }` — no form shown. After save, sets `seedup_eval_saved`.

---

### Discord OAuth (`src/app/api/discord/`)

**`GET /api/discord/login?email=<email>`** — builds OAuth URL. Email is base64-encoded into the `state` param.

**`GET /api/discord/callback`** — full OAuth callback:
1. Decodes `state` → email → looks up user in Supabase.
2. Exchanges `code` for access token.
3. Gets Discord user (id + username).
4. Auto-joins user to guild (`PUT /guilds/{id}/members/{userId}`).
5. Assigns level role (`PUT /guilds/{id}/members/{userId}/roles/{roleId}`).
6. Saves `discord_id` + `discord_username` to `users`.
7. Redirects to `/resultado?discord=success|error&...`.

**Role IDs** come from env vars: `DISCORD_ROLE_DEV_ZERO` … `DISCORD_ROLE_DEV_PLATINUM`. `ROLE_MAP` is defined in `src/lib/niveles.ts` (single source of truth — used by both callback and update-level).

---

### Email system (`src/lib/email.ts`)

Uses **Resend** SDK. Client is initialized lazily inside each function (not at module level) to avoid build-time errors when `RESEND_API_KEY` is absent.

- `sendWelcomeEmail({ to, nombres, nivel })` — sent automatically by `save-user` for new users. Button links directly to `/api/discord/login?email=<email>`.
- `sendFollowupEmail({ to, nombres })` — triggered manually via `POST /api/send-followup`. Links to `/dashboard?email=<email>&source=email`.

Both functions return `boolean` (success/failure) and never throw — failures are logged to `communications_log` with `status: 'failed'`.

---

### Discord notifications (`src/lib/discord.ts`)

`sendDiscordMessage(content: string)` — posts a plain-text message to `#logros` via Discord REST API v10. Uses `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_LOGROS_ID`. Never throws — errors are logged with `console.error` and silently swallowed so the main flow is never broken.

Called from `save-user` with `void` (fire-and-forget) after `applyLevelUpdate()`:
- `upgraded === true` → `🔥 {nombre} subió a {new_level} 🚀`
- `upgraded === false` → `🧠 {nombre} completó la evaluación`

`displayName` priority: `nombres` from request body → `nombres` from DB (fetched for returning users) → email fallback. The `select` on `users` for returning users includes `nombres` for this reason.

---

### Feedback system

**`POST /api/feedback`** — saves `{ email, rating (1–5), message?, source ('web'|'email') }`. Looks up user by email, inserts into `feedback` table.

**`src/components/feedback/FeedbackForm.tsx`** — star rating (1–5) + optional message textarea. Appears in two places:
- `/resultado` success state (after Discord section) — `source: 'web'`
- `/dashboard` (bottom of page) — `source` comes from URL query param (set to `'email'` when user clicks from followup email)

---

### Dashboard (`/dashboard`)

Client page with two states:
- **Email in sessionStorage or URL param**: auto-fetches `GET /api/dashboard?email=<email>` and shows level, stats, evaluation history (last 5), last feedback, and `FeedbackForm`.
- **No email**: shows input form "Ingresa tu correo para ver tu progreso".

`GET /api/dashboard?email=` — returns `{ nombres, apellidos, current_level, member_since, evaluations[], last_feedback }`.

`useSearchParams` is used inside a `<Suspense>` boundary to satisfy Next.js App Router requirements.

---

### Monetization — Stripe (`src/lib/stripe.ts`, `src/lib/subscription.ts`)

**⚠️ PENDIENTE DE ACTIVACIÓN** — Ver sección "Pendiente" al final.

Stripe SDK v22, API version `2026-03-25.dahlia`. Both lib files use lazy initialization (same pattern as Resend).

- `getStripe()` — returns singleton Stripe client, throws if `STRIPE_SECRET_KEY` not set.
- `isPro(email)` — checks `subscriptions` table: `plan = 'pro' AND status = 'active'`.
- `getOrCreateStripeCustomer(stripe, userId, email)` — finds existing `stripe_customer_id` in DB or creates new Stripe customer and upserts into `subscriptions`.

**Checkout flow** (`POST /api/checkout`):
- Receives `{ email, plan: 'monthly' | 'yearly' }`.
- User must already exist in `users` table (must have completed evaluation).
- Creates/reuses Stripe customer, creates Checkout Session, returns `{ url }` → client redirects.

**Webhooks** (`POST /api/webhooks/stripe`):
- Validates `stripe-signature` header using raw body (`req.text()` — never parse JSON before verifying).
- Handles: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
- All sync to `subscriptions` table via `upsert` on `stripe_customer_id`.
- `invoice.paid` uses customer-based subscription lookup (not `invoice.subscription` — removed in API v2026).

**Billing portal** (`POST /api/billing/portal`) — creates Stripe Portal session for managing/canceling subscriptions.

**Paywall** — enforced server-side in `GET /api/lessons/[id]`: if `lesson.is_premium` and not `isPro(email)`, returns `{ paywalled: true }`. Frontend shows `PaywallModal`.

---

### Learning platform

**Content hierarchy**: `learning_paths` → `modules` → `lessons` (all cascade-delete).

**Admin CRUD** (`/admin/learning-paths` → `/admin/modules` → `/admin/lessons`):
- Hierarchical navigation with breadcrumbs (path_id + path_name passed via query params).
- Lesson editor: textarea with markdown preview toggle.
- Seed endpoint: `POST /api/admin/seed` — inserts 3 paths, 6 modules, 10 lessons. Run once.

**Public API:**
- `GET /api/learning-paths?level=` — full hierarchy (paths → modules → lessons metadata, no content).
- `GET /api/modules?path_id=` — modules with lesson list for a path.
- `GET /api/lessons/[id]?email=` — full lesson content. Returns `{ paywalled: true }` if premium + not pro. Logs access to `lesson_access_logs`.
- `GET /api/progress?email=&lesson_ids[]=` — progress map `{ lesson_id: percentage }`. If no `lesson_ids`, returns all user progress.
- `POST /api/progress/update` — upserts `user_progress`. Sets `completed = true` when `progress_percentage = 100`.

**LessonPlayer** (`src/components/learning/LessonPlayer.tsx`):
- Renders markdown via `react-markdown` + `remark-gfm`.
- Auto-completes lesson via `IntersectionObserver` when bottom div reaches 90% viewport.
- Calls `POST /api/progress/update` on complete.

---

### Recommendations engine (`GET /api/recommendations?email=`)

Priority scoring (higher = shown first):
- `+100` — lesson in progress (pct > 0, not complete)
- `+80` — path matches `current_level`
- `+60` — path is one level above current (aspirational)
- `+50` — path is one level below (reinforcement)
- `+20` bonus — lesson title matches evaluation `debilidades`

Returns top 5. Shown in dashboard and accessible from `/learning`.

---

### Admin panel (`/admin`)

Protected by `AdminGuard` (`src/components/admin/AdminGuard.tsx`) — a client component wrapping the entire admin layout. On mount it checks `sessionStorage['seedup_admin_email']` → falls back to `sessionStorage['seedup_registro_email']` → shows email input if neither exists. Calls `GET /api/admin/verify?email=` which checks `users.is_admin = true`. On success stores email in `seedup_admin_email`.

**All admin API endpoints** (`src/app/api/admin/`) verify the caller via `verifyAdminByEmail()` from `src/lib/admin.ts`. Pass the admin email as a query param (`?email=`) for GET or in the request body for POST.

**Endpoints:**
- `GET /api/admin/stats` — global metrics: total users, level distribution, avg rating, total evaluations, upgrades, critical user count.
- `GET /api/admin/users?search=` — user list with `is_critical` flag per user.
- `GET /api/admin/user/[id]` — full profile: user data + evaluations + feedback + progress_logs.
- `POST /api/admin/update-level` — `{ admin_email, user_id, new_level, reason? }`. Bypasses the no-downgrade rule. Syncs Discord roles. Logs to `admin_logs` and `progress_logs`.
- `GET /api/admin/feedback?rating=` — all feedback with user info, filterable by star rating.
- `GET/POST /api/admin/learning-paths` + `PUT/DELETE /api/admin/learning-paths/[id]`
- `GET/POST /api/admin/modules` + `PUT/DELETE /api/admin/modules/[id]`
- `GET/POST /api/admin/lessons` + `GET/PUT/DELETE /api/admin/lessons/[id]`
- `POST /api/admin/seed` — inserts seed content (run once, prompts confirmation in UI)

**Critical user definition** (computed in-memory in stats and users endpoints):
- Condition A: exactly 1 evaluation AND registered > 7 days ago
- Condition B: no evaluation in the last 14 days
- A user is critical if A **or** B is true.

**To grant admin access**: `UPDATE users SET is_admin = true WHERE email = 'email@example.com';`

---

### Database schema (Supabase)

**`users`**: `id`, `nombres`, `apellidos`, `email`, `telefono`, `discord_id`, `discord_username`, `current_level`, `is_admin` (boolean, default false), `activity_score` (default 0), `last_contacted_at` (nullable), `last_evaluation_at` (nullable TIMESTAMPTZ — cooldown gate), `created_at`

**`evaluations`**: `id`, `user_id`, `nivel`, `score`, `fortalezas` (json), `debilidades` (json), `created_at`

**`progress_logs`**: `id`, `user_id`, `previous_level`, `new_level`, `reason` (default `'evaluation'`, `'admin_override'` when set by admin), `created_at`

**`feedback`**: `id`, `user_id`, `rating` (1–5), `message` (nullable), `source` (`'web'`|`'email'`), `created_at`

**`communications_log`**: `id`, `user_id`, `type` (`'welcome'`|`'followup'`), `status` (`'sent'`|`'failed'`), `created_at`

**`admin_logs`**: `id`, `admin_id`, `action`, `target_user_id`, `metadata` (json), `created_at`

**`subscriptions`**: `id`, `user_id`, `stripe_customer_id` (unique), `stripe_subscription_id` (unique, nullable), `plan` (`'free'`|`'pro'`), `status` (`'active'`|`'canceled'`|`'past_due'`), `current_period_end` (nullable), `created_at`

**`learning_paths`**: `id`, `name`, `description`, `level`, `is_premium` (boolean), `order_index`, `created_at`

**`modules`**: `id`, `learning_path_id` (→ learning_paths CASCADE), `title`, `description`, `order_index`, `created_at`

**`lessons`**: `id`, `module_id` (→ modules CASCADE), `title`, `content` (markdown), `is_premium` (boolean), `duration_minutes`, `order_index`, `created_at`

**`user_progress`**: `id`, `user_id`, `lesson_id`, `completed` (boolean), `progress_percentage` (0–100), `completed_at` (nullable), `created_at`. UNIQUE on `(user_id, lesson_id)`.

**`lesson_access_logs`**: `id`, `user_id`, `lesson_id`, `accessed_at`

**`projects`**: `id`, `name`, `description`, `difficulty` (nivel exacto), `repo_url`, `figma_url`, `team_scope` (jsonb: `{ frontend, backend, extra, stack }`), `created_at`. 25 proyectos seed (5 por nivel). Ejecutar una vez: `POST /api/admin/seed-projects`.

**`teams`**: `id`, `name`, `level`, `status` (`'forming'` when created manually via admin, `'active'` when created by auto-matching), `project_id` (→ projects), `created_at`

**`team_members`**: `id`, `team_id` (→ teams), `user_id` (→ users), `role` (`'member'`), `joined_at`. UNIQUE on `user_id`.

**`team_applications`**: `id`, `user_id` (→ users), `stack`, `availability`, `level`, `status` (`'pending'`|`'assigned'`), `created_at`.

**`discord_activity_logs`**: `id`, `discord_id` (text), `user_id` (→ users SET NULL), `event_type`, `channel_name`, `metadata` (jsonb), `created_at` (timestamptz). Indexes on `discord_id` y `created_at`.

**`community_engagement_scores`**: `id`, `user_id` (→ users CASCADE), `weekly_messages`, `weekly_reactions`, `weekly_challenges`, `weekly_voice`, `weekly_mentions`, `engagement_score`, `engagement_tier` (text, default `'passive'`), `last_calculated_at` (timestamptz). UNIQUE on `user_id`. Index on `engagement_score DESC`. (`weekly_mentions` and `engagement_tier` added in Sprint 4 migration.)

**`mentor_sessions`**: `id`, `mentor_user_id` (→ users CASCADE), `mentee_user_id` (→ users CASCADE), `status` (`'pending'`|`'active'`|`'closed'`), `created_at`.

**`opportunity_matches`**: `id`, `user_id` (→ users CASCADE), `opportunity_type` (`'freelance'`|`'founder'`|`'mentor'`|`'collaborator'`), `notes`, `status` (`'open'`|`'matched'`|`'closed'`), `created_at`.

**`automation_events`**: `id`, `event_name`, `status`, `metadata` (jsonb), `created_at` (timestamptz). Index on `created_at DESC`.

**`discord_visitors`**: `id`, `discord_id` (text, unique), `discord_username` (text, nullable), `status` (`'visitor'`|`'verified'`, default `'visitor'`), `first_seen_at` (timestamptz, default now()), `last_seen_at` (timestamptz, default now()), `verified_user_id` (uuid, → users nullable), `verified_at` (timestamptz, nullable).

```sql
CREATE TABLE discord_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text UNIQUE NOT NULL,
  discord_username text,
  status text NOT NULL DEFAULT 'visitor',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  verified_user_id uuid REFERENCES users(id),
  verified_at timestamptz
);
```

Supabase client (`src/lib/supabase.ts`) uses the service role key — server-side only, never exposed to the client. All DB access goes through `supabaseAdmin`.

---

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_BOT_TOKEN
DISCORD_CHANNEL_LOGROS_ID        # ID del canal #logros (Discord developer mode → right-click channel → Copy ID)
DISCORD_REDIRECT_URI          # Must match exactly what's registered in Discord portal (no trailing newline — use printf when adding via Vercel CLI)
DISCORD_GUILD_ID
DISCORD_ROLE_DEV_ZERO
DISCORD_ROLE_DEV_BRONCE
DISCORD_ROLE_DEV_SILVER
DISCORD_ROLE_DEV_GOLD
DISCORD_ROLE_DEV_PLATINUM
RESEND_API_KEY                # Resend API key (re_...)
RESEND_FROM_EMAIL             # Sender address e.g. "SeedUp Devs <carlos@axiondev.dev>"
NEXT_PUBLIC_SITE_URL          # Production URL e.g. https://seedupdevs.vercel.app
CRON_SECRET                   # Secret para autenticar llamadas del cron de Vercel — todos los endpoints GET de /api/community/* y /api/teams/match
DISCORD_CHANNEL_DAILY_ID      # ID canal #daily-seed
DISCORD_CHANNEL_RETOS_ID      # ID canal #retos
DISCORD_CHANNEL_WINS_ID           # ID canal #wins
DISCORD_CHANNEL_GENERAL_ID        # ID canal #general (nudges de inactividad)
DISCORD_CHANNEL_OPPORTUNITIES_ID  # ID canal #oportunidades (Phase E — publicación de oportunidades detectadas)
DISCORD_BOT_SECRET            # Secret arbitrario para autenticar POST /api/discord/activity y POST /api/discord/member-join desde el bot
DISCORD_ROLE_VISITOR          # ID del rol Visitor en Discord (asignado a miembros no verificados)
# Stripe — pendiente de configurar (ver sección Pendiente)
STRIPE_SECRET_KEY             # sk_live_... or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # pk_live_... or pk_test_...
STRIPE_WEBHOOK_SECRET         # whsec_... (from Stripe CLI or dashboard)
STRIPE_PRICE_ID_PRO_MONTHLY   # price_... (Pro Monthly product)
STRIPE_PRICE_ID_PRO_YEARLY    # price_... (Pro Yearly product)
```

---

## Key decisions

- No global state management — `useState`/`useEffect` only. Cross-page state via `sessionStorage`.
- `React.FormEvent` is deprecated in React 19 — use `React.SyntheticEvent<HTMLFormElement>` for form handlers.
- All interactive components carry `'use client'`. Only `CircuitBackground` and `Logo` are purely presentational.
- `LandingContent.tsx` contains all landing section sub-components in one file — add new sections there, not in separate files.
- `current_level` = best level ever achieved. Never downgrades automatically.
- Resend client must be initialized inside functions, not at module level — avoids `Missing API key` error during Next.js build-time static analysis.
- `useSearchParams` always requires a `<Suspense>` boundary in Next.js App Router — wrap the component that calls it, not the page export.
- Admin auth is sessionStorage-based (no JWT/cookies). `AdminGuard` validates on every mount via API. All admin endpoints re-verify independently — never trust client state alone.
- Admin level override bypasses the no-downgrade rule intentionally — do not reuse `applyLevelUpdate` for admin overrides, use `POST /api/admin/update-level` instead.
- Stripe client (`src/lib/stripe.ts`) uses lazy singleton — same pattern as Resend. Never instantiate at module level.
- Stripe webhook handler must read raw body with `req.text()` before verifying signature — never parse JSON first or signature check fails.
- `invoice.subscription` was removed in Stripe API `2026-03-25.dahlia` — use `stripe.subscriptions.list({ customer })` instead in `handleInvoicePaid`.
- `current_period_end` on Stripe `Subscription` type requires a cast in API `2026-03-25.dahlia` — access via `(sub as unknown as { current_period_end?: number }).current_period_end`.
- Paywall is enforced server-side only (`/api/lessons/[id]`). Frontend `PaywallModal` is UI only — never trust it alone.
- Seed content (`POST /api/admin/seed`) should only be run once. The UI button prompts confirmation. Running again creates duplicate paths.
- `POST /api/admin/seed-projects` should also only be run once — skips duplicates by `name` but safe to re-run.
- Discord `createDiscordTeamSpace` calls must be `await`ed, not `void` — Vercel serverless functions terminate before fire-and-forget async calls complete, causing silent failures (category created, channels not).
- Discord bot must have **Administrator** permission in the server. Category-level `@everyone` VIEW_CHANNEL deny blocks the bot from creating child channels even with guild-level MANAGE_CHANNELS permission.
- `useSearchParams` in `/admin/modules` and `/admin/lessons` requires `<Suspense>` boundary — already wrapped in both page exports.
- Supabase FK join results are typed as arrays; cast to the target type through `unknown` first: `(membership.teams as unknown) as TeamRow | null`.
- Cron auth centralizada en `src/lib/cron-auth.ts` — `validateCronRequest(req)` + `unauthorizedCronResponse(req)`. Todos los endpoints GET de crons deben usar estas funciones, nunca validar el header manualmente. El header se lee en minúscula (`authorization`) y se aplica `.trim()` para evitar fallos por espacios o saltos de línea en el valor del secret.

---

### Evaluation cooldown

**7-day rate limit** on evaluations via `last_evaluation_at TIMESTAMPTZ` in `users`.

- `/api/evaluar` accepts optional `email` in body. If present and user has `last_evaluation_at`, checks `(Date.now() - date) / ms_per_day`. Returns 429 `{ error: 'cooldown', daysLeft }` if < 7 days.
- `last_evaluation_at` is updated in `/api/save-user` after the evaluation is persisted — not in `/api/evaluar`, so partial flows don't consume the cooldown.
- New users (no email in body) skip the cooldown gate entirely.
- `/evaluacion` page reads `seedup_registro_email` from sessionStorage and passes it as `email` in the eval request body. Handles 429 by dispatching `SET_ERROR`.

---

### Teams system

Full team assignment flow: users apply from dashboard → admin assigns from `/admin/teams`.

**DB tables:**
- `teams`: `id`, `name`, `level`, `status` (`'forming'` via admin create, `'active'` via auto-match), `created_at`
- `team_members`: `id`, `team_id`, `user_id`, `role` (`'member'`), `joined_at`. `UNIQUE(user_id)` — one active team per user.
- `team_applications`: `id`, `user_id`, `stack`, `availability`, `level`, `status` (`'pending'`|`'assigned'`), `created_at`. `UNIQUE(user_id)` where status is pending (enforced in apply endpoint).

**API endpoints:**
- `GET /api/teams` — public, returns teams with `member_count`
- `POST /api/teams/apply` — body: `{ email, stack, availability }`. Level always read from DB (`users.current_level`), never from client. Validates no pending application, not already in team.
- `GET /api/teams/my-status?email=` — returns `{ application, team }`. Used by dashboard component.
- `GET /api/teams/applications?email=` — admin-only, returns pending applications with user info.
- `POST /api/teams/create` — admin, body: `{ admin_email, name, level }`. Sends Discord `👥 Nuevo equipo creado: {name}`.
- `POST /api/teams/assign` — admin, body: `{ admin_email, team_id, user_ids[] }`. Validates level match between team and users. Inserts `team_members`, updates applications to `'assigned'`. Sends Discord `👤 {nombre} fue asignado al equipo {team.name}` per user.

**UI:**
- `src/components/teams/TeamApplicationSection.tsx` — dashboard card: state machine rendering form → pending → assigned views.
- `src/app/admin/teams/page.tsx` — two-tab admin page: Applications (inline assign dropdown filtered by matching level) + Teams (list + create form). Includes "Auto-matching" button that calls `POST /api/teams/match`.

---

### Auto-matching (`src/lib/matching.ts`)

`matchTeams()` — automated team formation run by cron or admin:

1. Fetches pending applications where the user has `discord_id` (users without Discord are skipped, stay `pending`).
2. Groups by `level` (stack is ignored in v1).
3. Per level: calls `getProjectForLevel(level)` (`src/lib/projects.ts`) — selects a random project (`ORDER BY RANDOM()`). If no project exists for that level, the entire level group is skipped (users stay `pending`).
4. Splits each level group into balanced teams of 3–5 using `splitIntoGroups()`:
   - `Math.ceil(n / 5)` groups, remainder distributed to first groups.
   - Groups < 3 are skipped (`teamsSkipped` count incremented).
5. Names teams sequentially: `Team-001`, `Team-002`... based on max existing number in DB (collision-safe).
6. For each group: inserts `teams` (status `'active'`, `project_id`), `team_members`, updates applications to `'assigned'`.
7. Awaits `createDiscordTeamSpace()` + `sendDiscordMessage` — must be `await`, not `void`. Vercel terminates functions before fire-and-forget calls complete.

**`POST /api/teams/match`** — manual execution (admin_email in body).
**`GET /api/teams/match`** — Vercel Cron execution (Authorization: Bearer CRON_SECRET header).

**Cron schedule**: `vercel.json` → `0 2 * * *` (2am daily). Vercel Hobby supports multiple crons with minimum daily frequency — timing is approximate, not guaranteed to the minute.

**Discord channel creation** (`src/lib/discord.ts` — `createDiscordTeamSpace(teamName, memberDiscordIds, level, project)`):
- Creates a category `Team {name}` with `@everyone` VIEW_CHANNEL denied, per-member allow overwrites.
- Creates 3 text channels (`general`, `daily`, `entregables`) under the category — channels inherit category permissions (no `permission_overwrites` on child channels).
- Sends data-driven welcome message to `#general` with full project info from `team_scope`.
- **Bot requires Administrator permission** in the Discord server — without it, creating channels inside a category with `@everyone` VIEW_CHANNEL denied returns 403.

**`src/lib/projects.ts`** — `getProjectForLevel(level)`: fetches all projects for that difficulty, returns one at random (JS `Math.random()`). Returns `null` if none exist.

**`POST /api/admin/seed-projects`** — inserts 25 projects (5 per level), skips duplicates by `name`. Run once after first deploy.

**Environment variable added:** `CRON_SECRET` — arbitrary secret set in Vercel Production. Vercel injects it as `Authorization: Bearer <secret>` on cron calls.

---

## Security hardening notes

### Known auth limitations (Sprint 1.5 — documented, not yet resolved)

**Admin auth is email + sessionStorage based.**
All admin pages pass `admin_email` via query param (GET) or request body (POST). `verifyAdminByEmail()` hits Supabase on every request. This is reasonable for a closed beta but is not production-grade: any caller with a known admin email can query admin endpoints directly.

Migration path (Sprint 2+):
1. Add Supabase Auth (magic link or OAuth).
2. Replace `admin_email` param with a verified JWT from `supabase.auth.getSession()` server-side.
3. Admin endpoints should use `supabase.auth.getUser(token)` and check `users.is_admin` from DB — never from client state.
4. Affected endpoints: all `GET /api/admin/*` and `POST /api/admin/*` that accept `email` or `admin_email`. See `src/lib/admin.ts` `verifyAdminByEmail()` as the central verification point to replace.

**Private user endpoints are email-based with no verification.**
`GET /api/teams/my-status?email=`, `GET /api/dashboard?email=`, `GET /api/progress?email=`, `GET /api/recommendations?email=` accept any email in the query string. Anyone who knows a user's email can query their data.

Sprint 1.5 mitigation: reduced unnecessary fields in `teams/my-status` (removed `id` from application, removed `created_at`).

Real fix: require authenticated session. Until then, do not add sensitive fields to these endpoints and treat returned data as semi-public.

**No secrets in frontend.**
`CRON_SECRET` is never passed to client code — the admin proxy (`POST /api/admin/community-action`) uses admin email auth instead. This must be maintained: any new automation trigger from the frontend must go through the admin proxy, never call cron endpoints directly.

**Evaluation cooldown bypass was fixed in Sprint 1.5.**
`POST /api/save-user` now re-checks `last_evaluation_at` for existing users before inserting a new evaluation. Both `/api/evaluar` and `/api/save-user` enforce the 7-day cooldown. Bypass via direct API call is no longer possible.

---

### Matching Engine V1 (Sprint 6)

User-to-user connection suggestions generated from opportunity data, engagement scores, and community activity. Admin-review-first — no public Discord notifications in V1.

**New table — run once in Supabase before first deploy:**

```sql
CREATE TABLE opportunity_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunity_matches(id) ON DELETE SET NULL,
  source_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type text NOT NULL CHECK (connection_type IN ('founder', 'freelance', 'mentor', 'collaborator')),
  score int NOT NULL DEFAULT 0,
  reasons jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'dismissed', 'notified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_opp_connections_source ON opportunity_connections(source_user_id);
CREATE INDEX idx_opp_connections_target ON opportunity_connections(target_user_id);
CREATE INDEX idx_opp_connections_status ON opportunity_connections(status);
CREATE INDEX idx_opp_connections_created_at ON opportunity_connections(created_at DESC);
```

**`src/lib/opportunity-matching.ts`** — `runOpportunityMatching()`:
1. Fetches all `opportunity_matches` where `status = 'open'` (the seekers).
2. Fetches all users + engagement scores (two separate queries, merged in JS to avoid FK aliasing complexity).
3. Fetches user IDs with activity in the last 7 days from `discord_activity_logs`.
4. For each open opportunity (source), scores all other users as candidates.
5. Skips self-match (`source_user_id === target_user_id`).
6. Only includes candidates with `score > SCORE_BASE` (at least one signal beyond the base).
7. Inserts top 3 candidates per opportunity as `status = 'suggested'`.
8. Prevents duplicates: checks existing `opportunity_connections` where `status IN ('suggested', 'approved', 'notified')` before inserting; adds key to in-memory set to prevent duplicates within the same run.
9. If one insert fails, logs error and continues with next candidate.
10. Logs to `automation_events` with `event_name = 'opportunity_matching_run'`.

**Scoring model** (max score = 100):

| Signal | Points |
|---|---|
| Base: opportunity type match detected | +30 |
| Target tier complements opportunity type | +25 |
| Target is `active`/`builder`/`leader` | +15 |
| Target has activity in last 7 days | +10 |
| Level compatible (same or ±1) | +10 |
| Target has same open opportunity type | +10 |

**Complementary tiers by type:**
- `mentor`: `['builder', 'leader']`
- `collaborator`, `founder`, `freelance`: `['active', 'builder', 'leader']`

**Reasons** are human-readable Spanish strings, e.g.:
- `"Oportunidad de tipo "mentor" detectada"`
- `"Perfil builder complementa la búsqueda"`
- `"Actividad reciente en Discord"`

**Duplicate prevention key:** `{opportunity_id}:{source_user_id}:{target_user_id}:{connection_type}`. Active statuses = `suggested`, `approved`, `notified`.

**Why V1 is admin-review only (no orchestrator):** The `opportunity_connections` table is new and must be created before the first deploy. Integrating into the orchestrator before confirming the table exists in production could silently fail or create partial state. Add to orchestrator in Sprint 7+ once confirmed in production and a sensible run interval is established.

**Admin endpoint:** `POST /api/admin/community/run-opportunity-matching`
- Body: `{ email: "<admin_email>" }`
- Auth: `verifyAdminByEmail()`
- Returns: `{ ok, created, skipped, failed, by_type, errors }`

**`GET /api/admin/community-stats`** now includes `opportunityMatchingAnalytics`:
- `lastRun` — timestamp of last `opportunity_matching_run` event
- `lastRunMeta` — `{ created, skipped, failed }` from that event
- `byStatus` — counts per status: `suggested`, `approved`, `dismissed`, `notified`
- `byType` — count of `suggested` connections per type
- `latestConnections` — last 10 connections with source/target user names

**`/admin/community`** — new "Matching de oportunidades" section:
- Status distribution cards (suggested / approved / dismissed / notified)
- "Ejecutar Matching" button (calls endpoint directly, not via community-action proxy)
- Table of latest connections (source → target, type badge, score, reasons, status)

**Admin QA steps:**

```bash
# 1. Crear tabla en Supabase (solo una vez)
# Ejecutar el SQL de CREATE TABLE documentado arriba

# 2. Ejecutar el matching manualmente
curl -X POST "https://seedupdevs.vercel.app/api/admin/community/run-opportunity-matching" \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin_email>"}'
# Respuesta esperada: { "ok": true, "created": N, "skipped": N, "failed": 0 }

# 3. Verificar conexiones en Supabase
# SELECT connection_type, status, score, reasons, created_at
# FROM opportunity_connections ORDER BY created_at DESC LIMIT 20;

# 4. Ejecutar de nuevo inmediatamente
# Respuesta esperada: created = 0, skipped = N (duplicados bloqueados)

# 5. Verificar automation_events
# SELECT event_name, status, metadata, created_at FROM automation_events
# WHERE event_name = 'opportunity_matching_run' ORDER BY created_at DESC LIMIT 5;

# 6. Verificar que /admin/community muestra la sección con las conexiones

# 7. Confirmar que NO se envía ningún mensaje a Discord en V1
```

---

## Pendiente

### Stripe — monetización bloqueada

Toda la integración de Stripe está implementada y el build compila, pero las 5 variables de entorno no están configuradas en Vercel porque aún no hay cuenta de pago activa.

**Qué falta:**
1. Resolver cuenta bancaria que soporte Stripe (Payoneer recomendado como pasarela para Colombia)
2. Crear cuenta en Stripe
3. Crear 2 productos en Stripe Dashboard → Products:
   - "SeedUp Pro Mensual" — precio $19/mes recurrente
   - "SeedUp Pro Anual" — precio $149/año recurrente
4. Configurar webhook en Stripe Dashboard → Developers → Webhooks:
   - URL: `https://seedupdevs.vercel.app/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Agregar las 5 variables a Vercel (Claude Code puede hacer esto directamente con `vercel env add`)

**Una vez resuelto:** pasar los valores a Claude Code y se agregan a Vercel en un minuto. No hay cambios de código pendientes.

### Seed de contenido

Después de activar Stripe (o independientemente), ejecutar el seed desde el panel admin:
- Ir a `/admin/learning-paths`
- Clic en "Seed inicial"
- Crea 3 rutas de aprendizaje, 6 módulos y 10 lecciones con contenido real en markdown

---

### Community Automation Engine (Phase D)

Automated engagement system that runs on Discord via Vercel Cron.

**Tablas en DB** (ya creadas en Supabase — SQL de referencia):

```sql
CREATE TABLE discord_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  channel_name text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_discord_activity_discord_id ON discord_activity_logs(discord_id);
CREATE INDEX idx_discord_activity_created_at ON discord_activity_logs(created_at);

CREATE TABLE community_engagement_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_messages int NOT NULL DEFAULT 0,
  weekly_reactions int NOT NULL DEFAULT 0,
  weekly_challenges int NOT NULL DEFAULT 0,
  weekly_voice int NOT NULL DEFAULT 0,
  engagement_score int NOT NULL DEFAULT 0,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX idx_engagement_score ON community_engagement_scores(engagement_score DESC);

CREATE TABLE mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE opportunity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_type text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE automation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  status text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_automation_events_created_at ON automation_events(created_at DESC);
```

**Variables de entorno** (ya configuradas en Vercel Production):
- `DISCORD_CHANNEL_DAILY_ID` — ID canal #daily-seed
- `DISCORD_CHANNEL_RETOS_ID` — ID canal #retos
- `DISCORD_CHANNEL_WINS_ID` — ID canal #wins
- `DISCORD_CHANNEL_GENERAL_ID` — ID canal #general (for inactivity nudges)
- `DISCORD_CHANNEL_OPPORTUNITIES_ID` — ID canal #oportunidades (Phase E — opportunity publishing)
- `DISCORD_BOT_SECRET` — arbitrary secret for authenticating `POST /api/discord/activity` from the bot

**Cron schedule** (`vercel.json`):
| Ruta | Horario UTC | Hora Colombia |
|---|---|---|
| `/api/teams/match` | `0 2 * * *` | 9pm prev |
| `/api/community/orchestrator` | `0 13 * * *` | 8am |

**Nota:** Los crons individuales de comunidad (`daily-seed`, `daily-challenge`, etc.) ya no están en `vercel.json`. El orchestrator corre diariamente a las 13:00 UTC y decide internamente qué jobs están pendientes según guards de frecuencia. Los route files individuales se conservan para invocación manual y botones de admin. Vercel Hobby permite múltiples crons con frecuencia mínima diaria — no es necesario Pro solo para activar los jobs, pero sí para frecuencia sub-diaria.

**Libs nuevas:**
- `src/types/community.ts` — `EventType`, `ActivityMetadata`, `DiscordActivityLog`, `CommunityEngagementScore`, `MentorSession`, `OpportunityMatch`, `AutomationEvent`, `ENGAGEMENT_POINTS`
- `src/lib/community-manager.ts` — prompt generators: `generateDailySeedPrompt()`, `generateDailyChallengePrompt()`, `generateWinPrompt()`, `generateInactivityMessage(discordId, userName)`, `generateWeeklyLeaderboardMessage(rankings)`. Las tres primeras seleccionan **aleatoriamente** (`Math.random()`) de bancos fijos: 20 daily seeds, 18 retos, 12 wins. `generateInactivityMessage` es determinista por longitud de username. No AI dependency. Para agregar mensajes: editar los arrays en este archivo y hacer deploy.
- `src/lib/community-manager.ts` NO usar selección determinista por día — los bancos se expandieron precisamente para evitar repetición semanal. Siempre usar `pickRandom()`.
- `src/lib/discord.ts` additions: `logDiscordActivity()`, `incrementEngagementScore()`, `sendInactivityNudge()`, `sendDailyPrompt()`, `sendChallengePrompt()`, `sendWinsPrompt()`, `sendOpportunityMessage({ userDiscordId, opportunityType, notes, channelName })` — publica al canal `DISCORD_CHANNEL_OPPORTUNITIES_ID`.
- `src/lib/community-actions.ts` — fuente única de lógica de automatización. Todos los cron endpoints (`/api/community/*`) importan de aquí. `POST /api/admin/community-action` también importa de aquí. Nunca duplicar la lógica en los route handlers.
- `src/lib/community-orchestrator.ts` — orquestador de jobs. Exporta `shouldRunJob(name, intervalMs)`, `logOrchestratorEvent(name, status, metadata)`, `runCommunityOrchestrator()`. Consulta `automation_events` con `event_name = orchestrator_*` y `status = ok` para determinar si un job está due. Si falla, el siguiente run lo reintenta. Logs de jobs individuales: `orchestrator_daily_seed`, `orchestrator_daily_challenge`, `orchestrator_daily_wins`, `orchestrator_inactive_nudges`, `orchestrator_scan_opportunities`, `orchestrator_weekly_ranking`, `orchestrator_weekly_reset`. Log de resumen: `orchestrator_run` (contiene `{ ran, skipped, failed }`). `weekly-reset` solo corre si `orchestrator_weekly_ranking` tiene un evento exitoso en los últimos 7 días.

**Inactivity nudge logic** (`/api/community/inactive-nudges`):
- Targets users with `discord_id` set, `last_evaluation_at < 7 days ago`, and `last_contacted_at IS NULL`.
- Sends to `#general` via `sendInactivityNudge()`.
- Logs event as `inactivity_nudge_sent` and sets `users.last_contacted_at`.
- Capped at 20 users per run.

**Activity ingestion** (`POST /api/discord/activity`):
- Authenticated via `x-bot-secret` header matching `DISCORD_BOT_SECRET`.
- Accepts `{ discord_id, event_type, channel_name?, metadata? }`.
- Calls `logDiscordActivity()` which: inserts into `discord_activity_logs`, resolves `user_id` from `discord_id`, calls `incrementEngagementScore()`.
- `incrementEngagementScore()` upserts `community_engagement_scores` — creates row on first event, increments on subsequent.

**Admin page** — `/admin/community`:
- Glass-style dashboard with stat cards (total logs, nudges, opportunities, mentor sessions).
- Top 5 engaged users by `engagement_score` this week.
- Recent automation events with status badges.
- **"Orquestador automático"** — sección read-only: último run, jobs ejecutados/omitidos/fallidos del último `orchestrator_run` event. Data viene de `GET /api/admin/community-stats` vía `orchestratorSummary`.
- Cron schedule reference table (updated: solo 2 crons activos).
- Auth via `seedup_admin_email` sessionStorage (same as other admin pages).

**Opportunity & mentor endpoints** (admin-only POST):
- `POST /api/community/scan-opportunities` — dos modos:
  - **Manual**: `{ admin_email, user_id, opportunity_type, notes? }` — inserta directamente en `opportunity_matches`.
  - **Auto**: `{ admin_email, mode: "auto" }` — escanea `discord_activity_logs` de los últimos 7 días buscando mensajes con keywords. Detecta el tipo de oportunidad, previene duplicados (mismo user + tipo + open en últimos 7 días), e inserta `opportunity_matches` automáticamente. Retorna `{ ok, scanned, created, skippedDuplicates, matches[] }`.
  - **Opportunity publishing (Phase E)**: cuando auto mode crea una nueva fila en `opportunity_matches`, busca el `discord_id` del usuario y llama `sendOpportunityMessage()` que publica al canal `DISCORD_CHANNEL_OPPORTUNITIES_ID`. Si el post a Discord falla, se logea en `automation_events` con `event_name: 'opportunity_discord_post_failed'` y `status: 'error'` — el endpoint no falla. Solo se publica en nuevas filas (no en `skippedDuplicates`). Usuarios sin `discord_id` no generan post.
  - Keywords soportadas por tipo:
    - `freelance`: freelance, trabajo freelance, busco trabajo, busco cliente, clientes, proyecto pago, paid project, client work
    - `founder`: cofounder, co-founder, socio, socio técnico, startup, fundador
    - `mentor`: mentor, mentoría, ayuda con, necesito ayuda, quién me ayuda, guía, guidance
    - `collaborator`: colaborar, colaboración, equipo, partner, construir juntos, open source
  - Detección case-insensitive sobre `metadata.content`. Nunca falla si metadata es null.
- `POST /api/community/create-mentor-session` — `{ admin_email, mentor_user_id, mentee_user_id }`. Inserts into `mentor_sessions` with status `'pending'`.
- `POST /api/admin/community-action` — proxy seguro que ejecuta acciones de automatización desde el panel admin sin exponer `CRON_SECRET` al cliente. Requiere `{ admin_email, action }`. Verifica admin con `verifyAdminByEmail()`. `action` debe pertenecer al allowlist estricto: `daily-seed | daily-challenge | daily-wins | weekly-ranking | inactive-nudges | weekly-reset | scan-opportunities`. Retorna `{ ok, action, result }`. Toda la lógica de ejecución vive en `src/lib/community-actions.ts` — tanto los cron endpoints como este proxy llaman las mismas funciones exportadas, sin duplicación. `CRON_SECRET` nunca sale al cliente porque este endpoint usa autenticación de admin en lugar de cron auth.

**`src/lib/community-actions.ts`** — funciones exportadas reutilizables: `runDailySeed`, `runDailyChallenge`, `runDailyWins`, `runWeeklyRanking`, `runInactiveNudges`, `runWeeklyReset`, `runScanOpportunities`. Los cron endpoints importan de aquí para evitar duplicación. `runScanOpportunities` incluye detección de keywords, prevención de duplicados, y publicación en Discord.

**Acciones rápidas en `/admin/community`** — sección "Acciones rápidas" con 7 botones. Cada botón muestra estado de carga (spinner), resultado inline (verde/rojo) con mensaje contextual, y refresca las estadísticas tras éxito. "Reset semanal" muestra `window.confirm` antes de ejecutar. Los botones llaman `POST /api/admin/community-action`.

---

### Community Orchestrator (`GET /api/community/orchestrator`)

Capa de orquestación que decide qué jobs correr en cada invocación basándose en `automation_events`. Auth vía `CRON_SECRET` (igual que crons individuales).

**Guards de frecuencia:**
| Job | Intervalo |
|---|---|
| daily-seed, daily-challenge, daily-wins, inactive-nudges | 24h |
| scan-opportunities | 2h |
| weekly-ranking, weekly-reset | 7 días |

**Estrategia Hobby (diario):** Un cron a las 13:00 UTC corre el orchestrator. Todos los jobs diarios se ejecutan en esa invocación. `daily-wins` pierde su horario ideal de 23:00 UTC — aceptable en Hobby.

**Estrategia Pro / scheduler externo:** Llamar el orchestrator cada hora (o cada 2h) desde cron.job u otro scheduler con `Authorization: Bearer <CRON_SECRET>`. Los guards garantizan que cada job corre exactamente con su frecuencia correcta sin duplicaciones.

**Respuesta:** `{ ok: true, ran: [...], skipped: [...], failed: [...] }`. Cada job fallido aparece en `failed` pero no interrumpe los demás.

**QA:**
```bash
# Primera llamada — corre jobs pendientes
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://seedupdevs.vercel.app/api/community/orchestrator

# Segunda llamada inmediata — debe skipear todo (o casi todo)
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://seedupdevs.vercel.app/api/community/orchestrator

# Verificar en Supabase:
# SELECT event_name, status, created_at FROM automation_events
# WHERE event_name LIKE 'orchestrator_%' ORDER BY created_at DESC LIMIT 20;
```

---

### Intelligent Community Scoring (Sprint 4)

**`src/lib/community-scoring.ts`** — single source of truth for scoring weights and tier logic:
- `ENGAGEMENT_POINTS` — weights: message:2, reaction:1, mention:2, join_voice:3, challenge_submit:8, member_join:0, inactivity_nudge_sent:0. `challenge_submit` was 5 in Sprint 1 — updated to 8 here.
- `calculateEngagementTier(score, weeklyBreakdown)` — deterministic: passive(0–9), active(10–29), builder(30–59 + ≥1 meaningful type), leader(60+ + ≥2 meaningful types). Meaningful types: message, mention, join_voice, challenge_submit.
- `getMeaningfulContributionCount(breakdown)` — counts how many meaningful types have count > 0 (0–4).
- `calculateEngagementScoreBreakdown(eventCounts)` — pure, returns `{ totalScore, byType }`.
- `recalculateCommunityScores()` — rebuilds the full `community_engagement_scores` state from `discord_activity_logs` for a rolling 7-day window. Idempotent. Resets inactive users (no logs in window) to zeroes. Returns `{ updated, windowStart, windowEnd }`.

**`ENGAGEMENT_POINTS` was moved from `src/types/community.ts` to `src/lib/community-scoring.ts`.** `types/community.ts` is now types-only. Import scoring weights from `community-scoring.ts`, not from `types/community.ts`.

**`incrementEngagementScore()`** (`src/lib/discord.ts`) updated:
- Imports `ENGAGEMENT_POINTS`, `calculateEngagementTier`, `WeeklyBreakdown` from `community-scoring.ts`.
- Handles `mention → weekly_mentions` in the column map.
- Computes and persists `engagement_tier` after every real-time increment (no extra DB read — computed from existing row + delta).

**Admin recalculation endpoint:** `POST /api/admin/community/recalculate-scores`
- Auth: `verifyAdminByEmail()`.
- Body: `{ admin_email }`.
- Response: `{ ok, updated, windowStart, windowEnd }`.
- Logs to `automation_events` with `event_name = community_scores_recalculated`, status `ok` or `error`, metadata includes `triggeredBy`.

**`/admin/community` additions:**
- Top 5 shows tier badge per user.
- "Distribución de engagement" section with 4 tier cards.
- "Recalcular scoring" standalone button (confirm dialog → POST recalculate → refresh stats).

**SQL migration — run before first production deploy of Sprint 4:**
```sql
ALTER TABLE community_engagement_scores
  ADD COLUMN IF NOT EXISTS weekly_mentions int NOT NULL DEFAULT 0;

ALTER TABLE community_engagement_scores
  ADD COLUMN IF NOT EXISTS engagement_tier text NOT NULL DEFAULT 'passive';
```

**Score semantics (Sprint 4):** `engagement_score` represents the weighted sum of the last 7 days (not cumulative). `recalculateCommunityScores()` overwrites it from logs. Between recalculations, `incrementEngagementScore()` adds real-time deltas — slight drift is acceptable and corrected on the next recalculation.

---

### External Scheduler Setup (Sprint 3)

The Vercel daily cron at 13:00 UTC is the fallback. For sub-daily execution (recommended: every 2 hours), configure an external scheduler.

**cron-job.org setup:**
1. Create a free account at cron-job.org
2. New cronjob → URL: `https://seedupdevs.vercel.app/api/community/orchestrator`
3. Method: GET
4. Headers: `Authorization: Bearer <CRON_SECRET>`
5. Schedule: every 2 hours (or every hour if needed)
6. Expected response: `{ "ok": true, "ran": [...], "skipped": [...], "failed": [...] }`

**Verify in Supabase after first external run:**
```sql
SELECT event_name, status, created_at
FROM automation_events
WHERE event_name = 'orchestrator_run'
ORDER BY created_at DESC LIMIT 5;
```

**Scheduler health** is tracked in `GET /api/admin/community-stats` → `schedulerHealth`:
- `status: "healthy"` — last `orchestrator_run` within 150 min (120 expected + 30 grace)
- `status: "delayed"` — last run older than 150 min
- `status: "missing"` — no `orchestrator_run` found, or DB query failed (check server logs)
- Visible in `/admin/community` → "Scheduler externo" section (read-only)

**Secret hygiene:**
- `CRON_SECRET` must never be passed to frontend code. Admin triggers use `POST /api/admin/community-action` (admin email auth) — never call cron endpoints from the browser.
- If the external scheduler credentials leak, rotate immediately: `vercel env rm CRON_SECRET production` → `vercel env add CRON_SECRET production` → update the Authorization header in cron-job.org → redeploy.
- After rotation, the old secret is invalid immediately on next Vercel deploy. Both Vercel and the external scheduler must use the same value.

---

### Gated Community — Visitor Tracking (Sprint 2)

Discord members who join the server without going through the platform are persisted as visitors until they complete evaluation + OAuth.

**New endpoint:** `POST /api/discord/member-join`
- Auth: `x-bot-secret` header matching `DISCORD_BOT_SECRET` (same as `/api/discord/activity`).
- Body: `{ discord_id: string, discord_username?: string }`
- If `discord_id` already belongs to a verified user → `{ ok: true, status: "already_verified" }`
- If unknown → upserts `discord_visitors`, attempts `assignVisitorRole`, logs `member_join` to `discord_activity_logs`, returns:
  - `{ ok: true, status: "visitor_assigned", roleAssigned: true }` — role assigned
  - `{ ok: true, status: "visitor_recorded_role_failed", roleAssigned: false }` — persisted but role failed (check logs)
- Upsert is idempotent on `discord_id`: only `last_seen_at` and `discord_username` update on conflict.

**OAuth callback update** (`src/app/api/discord/callback/route.ts`):
After successful level role assignment, best-effort cleanup runs:
1. `removeVisitorRole(discordId)` — removes Visitor role. No-op if `DISCORD_ROLE_VISITOR` not set. Logs error but never fails the OAuth redirect.
2. Updates `discord_visitors` row: `status = 'verified'`, `verified_user_id`, `verified_at`. No row to update = silent no-op (user was not a tracked visitor).

**Helper functions in `src/lib/discord.ts`:**
- `assignVisitorRole(discordId)` — PUT role. Returns `false` if `DISCORD_ROLE_VISITOR` or `DISCORD_GUILD_ID` not set.
- `removeVisitorRole(discordId)` — DELETE role. Same guard. Returns `false` on env var absence or Discord error.
- Both use the private `discordRequest` helper (which now handles 204 No Content responses).

**`EventType` extended:** `member_join` added with `ENGAGEMENT_POINTS = 0`. Used by `logDiscordActivity` to record join events in `discord_activity_logs`.

**Admin metrics** (`GET /api/admin/community-stats`): response now includes `visitors: { total, active, verified, recent[] }`.
- `active`: `status = 'visitor'` (pending verification)
- `verified`: `status = 'verified'`
- `recent`: latest 5 rows ordered by `first_seen_at DESC`, fields: `discord_username, status, first_seen_at, verified_at`

**Discord manual setup (one-time, per server):**
1. Create a "Visitor" role in Discord Server Settings → Roles. Place it **below** the bot's role in the list — Discord enforces that bots can only assign roles below their own.
2. Configure Visitor role permissions: remove Send Messages, Add Reactions; keep Read Message History for designated welcome channel only. Lock all other channels to prevent Visitor access.
3. Copy the Visitor role ID (Developer Mode → right-click role → Copy ID) and add `DISCORD_ROLE_VISITOR` to Vercel env vars.
4. In the Discord bot code, listen to the `guildMemberAdd` event and call `POST /api/discord/member-join` with `{ discord_id, discord_username }` and the `x-bot-secret` header.
5. Required bot permissions: Manage Roles (to assign/remove Visitor role), plus any existing permissions already configured (Administrator covers all).

**QA steps:**
```bash
# 1. Reject missing secret
curl -s -X POST https://seedupdevs.vercel.app/api/discord/member-join \
  -H "Content-Type: application/json" \
  -d '{"discord_id":"123"}' | jq .
# Expect: { error: "Unauthorized" } 401

# 2. Reject wrong secret
curl -s -X POST https://seedupdevs.vercel.app/api/discord/member-join \
  -H "Content-Type: application/json" \
  -H "x-bot-secret: wrong" \
  -d '{"discord_id":"123"}' | jq .
# Expect: { error: "Unauthorized" } 401

# 3. Unknown discord_id → visitor record created
curl -s -X POST https://seedupdevs.vercel.app/api/discord/member-join \
  -H "Content-Type: application/json" \
  -H "x-bot-secret: <DISCORD_BOT_SECRET>" \
  -d '{"discord_id":"<test_id>","discord_username":"tester"}' | jq .
# Expect: { ok: true, status: "visitor_assigned"|"visitor_recorded_role_failed", roleAssigned: bool }
# Verify: SELECT * FROM discord_visitors WHERE discord_id = '<test_id>';

# 4. Same discord_id again → idempotent (no duplicate row)
# (repeat step 3 — expect same response, single row in discord_visitors with updated last_seen_at)

# 5. Complete Discord OAuth for that discord_id
# → Visitor role removed from member in Discord
# → discord_visitors row: status = 'verified', verified_at set
# → level role assigned (existing behavior unchanged)

# 6. Verify admin dashboard
# GET /api/admin/community-stats?email=<admin_email> → visitors.active decremented, visitors.verified incremented
# /admin/community → "Visitantes Discord" section reflects updated counts
```

---

### Smart Nudges & Retention Automation (Sprint 5)

**`src/lib/community-nudges.ts`** — main nudge module. Called by `runInactiveNudges()` in `community-actions.ts`. Public contract unchanged.

**`runSmartNudges()`** — processes 4 segments in priority order, caps at 5 per segment (20 total per run), ensures one nudge per user per run, cooldown 7 days per user per segment.

**Segments (priority order):**

| Segment | Eligibility | Window |
|---|---|---|
| `inactive` | Has `discord_id`, no non-nudge activity in `discord_activity_logs` | 14 days |
| `new-no-action` | Has `discord_id`, `created_at >= 14 days ago`, fewer than 5 activity events since creation | 14 days |
| `team-silent` | In `team_members`, has `discord_id`, no activity in `discord_activity_logs` | 7 days |
| `active-no-win` | `engagement_tier` IN (`active`, `builder`, `leader`), no `challenge_submit` AND no `message` in channel `wins` | 14 days |

**Cooldown guard:**
- Event type: `retention_nudge_sent` (0 engagement points) inserted into `discord_activity_logs` after each send
- Metadata: `{ segment, reason, status }`
- Cooldown check: query `discord_activity_logs` for `event_type = retention_nudge_sent` AND `metadata->>segment = <segment>` AND `user_id = <user_id>` in last 7 days
- Fail-safe: if cooldown query fails, skip entire segment (no send)

**Win signal detection for `active-no-win`:**
- Primary: `event_type = 'message' AND channel_name = 'wins'` (requires Discord bot to log channel_name)
- Fallback: `event_type = 'challenge_submit'`
- Both checked as OR — presence of either skips the user

**Safety rules:**
- Maximum 1 nudge per user per run (priority order enforced via `nudgedThisRun` Set)
- If segment candidate query fails → skip segment, log error, continue
- If Discord send throws → mark as `failed`, log, continue with next user
- If outcome logging fails → log error, continue (send already happened)
- `DISCORD_CHANNEL_GENERAL_ID` absence → abort entire run immediately

**Run summary logged to `automation_events`:**
- `event_name: 'inactive_nudges_sent'`
- `metadata: { sent, skipped, failed, by_segment: Record<NudgeSegment, {sent, skipped, failed}> }`
- Legacy format (pre-Sprint 5): `metadata: { count: N }` — handled in stats endpoint with fallback

**New EventType:** `retention_nudge_sent` (added to `src/types/community.ts` and `ENGAGEMENT_POINTS` in `community-scoring.ts` with 0 points).

**Admin analytics** (`GET /api/admin/community-stats` → `nudgeAnalytics`):
- `lastRun`: timestamp of latest `inactive_nudges_sent` automation event
- `last7d`: `{ sent, skipped, failed }` aggregated from all runs in last 7 days
- `by_segment`: per-segment aggregates for last 7 days
- Shown in `/admin/community` → "Nudges de retención" section

**QA steps:**
```bash
# 1. Build and lint
npm run build
npx eslint src/lib/community-nudges.ts src/app/api/admin/community-stats/route.ts src/app/admin/community/page.tsx

# 2. Trigger nudge run via admin panel
# → Go to /admin/community → Acciones rápidas → "Ejecutar Nudges"
# → Expect: inline result shows nudged count (may be 0 if no eligible users)

# 3. Check automation_events log in Supabase
# SELECT event_name, status, metadata, created_at FROM automation_events
# WHERE event_name = 'inactive_nudges_sent' ORDER BY created_at DESC LIMIT 5;
# → metadata must include { sent, skipped, failed, by_segment }

# 4. Verify cooldown (run again immediately)
# → Expected: all users skipped (by_segment shows skipped count, sent = 0)

# 5. Check discord_activity_logs for nudge records
# SELECT discord_id, user_id, event_type, metadata, created_at
# FROM discord_activity_logs WHERE event_type = 'retention_nudge_sent'
# ORDER BY created_at DESC LIMIT 10;

# 6. Verify /admin/community shows nudge analytics section
# GET /api/admin/community-stats?email=<admin_email>
# → response.nudgeAnalytics must have lastRun, last7d, by_segment

# 7. Confirm orchestrator still works
# curl -H "Authorization: Bearer <CRON_SECRET>" \
#   https://seedupdevs.vercel.app/api/community/orchestrator
# → orchestrator_inactive_nudges must appear in ran[] or skipped[]
```

**Operational notes:**
- `skipped` count per segment = users in cooldown + users already nudged this run by higher-priority segment
- `NUDGE_TYPES` set in `community-nudges.ts` excludes nudge events from "recent activity" checks — prevents nudge events from counting as real user activity
- `recalculateCommunityScores()` also picks up `retention_nudge_sent` events but they contribute 0 points — no score impact
- Adding a new message template: edit `nudgeMessage()` switch in `community-nudges.ts`
- Adding a new segment: add to `NudgeSegment` union, `PRIORITY` array, `segmentFns` map, and `by_segment` initializer in `runSmartNudges()`
