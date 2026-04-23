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

**Key types** (`src/types/evaluacion.ts`): `Nivel`, `Habilidad`, `Pregunta`, `RespuestaUsuario`, `ResultadoEvaluacion`.

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

**`users`**: `id`, `nombres`, `apellidos`, `email`, `telefono`, `discord_id`, `discord_username`, `current_level`, `is_admin` (boolean, default false), `activity_score` (default 0), `last_contacted_at` (nullable), `created_at`

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
- `useSearchParams` in `/admin/modules` and `/admin/lessons` requires `<Suspense>` boundary — already wrapped in both page exports.

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
