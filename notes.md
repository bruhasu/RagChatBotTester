# Project notes

A dated log of what we tried and what broke (the PDF asks for this). Add to it every day.

## 2026-10-22

**Done**
- Read `Test website.pdf` and wrote `CLAUDE.md` (rules, folder structure, week plan).
- Built `mock-router/` (fake `/v1/chat` + `/v1/feedback` on port 3000, two fake keys, 401 on a wrong key).
- Built `server/` (Express backend: `/chat`, `/feedback`, `/config`), with `.env.tenantA` (port 4000) and `.env.tenantB` (port 4001).
- Tested both tenants with `curl.exe`. Answers and sources came back tagged with the right tenant.
- Built the React site in `client/` (Vite): Home, Chat, About pages, plus the Navbar, Footer and MessageBubble components.
- Branding for both tenants is in `client/src/tenantConfig.js`. Switch with `npm run dev:a` / `npm run dev:b`.
- The Chat page uses fake replies from `client/src/chatService.js` (not connected to the backend yet).

- Renamed Tenant A to a real university's name for a local demo (changed back to fictional Bagwis University on 2026-10-23, see below).
- Tenant A used that university's real logo for the local demo (never published). Logos keep their shape (`object-fit: contain`).
- Tried a `#32418C` navbar color, then undid it. Navbar is back to navy `#1B2A4A`.
- Home page: added "Browse by topic", "Important dates", "How it works", "Top questions", and "Need a human?" sections, plus a "Based on the Student Handbook" line. All text and dates are in `client/src/homeContent.js` (Tenant A and Tenant B). "Try asking" cards now have a hover effect and arrow.
- Got a proposal for a full RAG backend (`rag-api/`: uploads, pgvector, cheap vs. strong model routing). **Waiting on decisions:** who builds it (me or my partner), tenant isolation, Docker vs. PGlite, embeddings provider, and Claude API key.

**What broke**
- Colors in `.env` came back empty: `#` starts a comment in `.env` files. Fix: put the color values in quotes (`"#1B2A4A"`).

- Changing the name in VS Code didn't show on the site: the file wasn't saved. Fix: Ctrl + S (or turn on File → Auto Save).

**Next**
- Connect the React site to the backend (swap in the real functions in `chatService.js`, add a Vite proxy).
- Ask the partner about the exact `/v1/chat` reply shape and the feedback endpoint.
- Answer the 5 RAG backend questions before any backend code is written.
- Replace the placeholder dates, email, and phone in `homeContent.js` before the demo.

## 2026-10-23

**Done**
- Tried a student-portal login section on top of the Home page (with a `lucide-react` icon). Then changed the plan: removed it, and uninstalled `lucide-react`.
- New `/login` page for Tenant A (`pages/Login/`), based on a common school-portal layout with our navy/gold colors: image carousel on the left, demo login form on the right.
- Demo login only: 3 fake accounts in `client/src/authService.js` (e.g. 2024-00001 / demo123). Only the name + Student ID go into sessionStorage. The password is never saved or sent.
- Home, Chat and About now redirect to `/login` until you log in. The Navbar shows the student's name and a "Log out" button.
- Tenant B has no login (`login: null` in `tenantConfig.js`).
- Banner images in `client/public/images/` are generated placeholders. Replace them.
- Added a "Library" card to "Browse by topic" (Tenant A, emoji 📚 like the other cards).
- Home page redesign: page and navbar are 1200px wide. The hero is now compact, with a search box ("Ask →" sends the question to Chat right away) and "Try:" pills that replace the old "Try asking" section. Topic cards are horizontal. Key dates and "Need a person?" are in a right sidebar. Checked at 1440px and 390px with headless Edge screenshots.
- Key dates and the contact email show **TODO** until the handbook exists.

**What broke**
- Topic card title and description ran together, and the card layout was ignored. Cause: `.card-link { display: block }` in `App.css` loads after `TopicGrid.css` and overrode it. Fix: a more specific selector (`.topic-grid .topic-card`).
- Blank white page after logging in. Cause: `TopicGrid.jsx` printed the lucide icon as `{topic.icon}` instead of drawing it as `<Icon />`. Fix: draw it as a component.

**Later the same day**
- Demo user renamed to "Jhon Bryan Castro" (same login, 2024-00001 / demo123).
- Login page: added a time and weather card (live Philippine time, date, Quezon City weather from Open-Meteo).
- Preparing for a public GitHub repo: Tenant A is now the fictional **Bagwis University** (wing logo, placeholder banners). Real-university files stay on this computer only (blocked in `.gitignore`). Added `README.md`.

## 2026-10-26

**Done**
- Removed the demo accounts. Real sign-up and login now, with one separate SQLite database per tenant (`server/data/tenantA.db`, `server/data/tenantB.db`, path set by `DB_PATH` in each `.env`). The `server/data/` folder is in `.gitignore`.
- New `server/auth.js`: `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/me`. Passwords hashed with bcrypt (`bcryptjs`), sessions in an httpOnly cookie named per tenant (`sid_tenantA` / `sid_tenantB`).
- New Create account page (`pages/Signup/`). Login and Signup share the new `components/AuthLayout/` (heading, carousel, colored panel).
- Home shows "Welcome, <name>!", and so does the Navbar. Chat, Home and About redirect to `/login` when logged out.
- Vite proxy sends `/auth` to the tenant's own backend (5173 → 4000, 5174 → 4001).
- Tested with PowerShell: signup, duplicate email, wrong password, login, logout. Same email and password on Tenant B → "Incorrect email or password". Tenant A's token sent to Tenant B → not logged in.

**What broke / watch out**
- Browsers send localhost cookies to every port, so both tenants would have overwritten one cookie. Fix: a different cookie name per tenant.
- `npm audit` warns about `body-parser` (comes with Express). `npm audit fix` in `server/` should fix it.
- The backend `/chat` and `/feedback` don't check the login yet (the Chat page still uses fake replies).

**Later the same day: getting ready for hosting**
- Plan: Vercel (two projects, one per tenant) + Render (mock router + one backend per tenant, from `render.yaml`) + Turso (one database per tenant).
- Picked Turso over Supabase: it's SQLite in the cloud, so the SQL in `auth.js` barely changed. Added `@libsql/client`. Locally it still opens `server/data/*.db` (via `DB_PATH`). When `DB_URL` is set, it uses Turso.
- The browser now calls `/api/...` for the backend. Vite (local) and `client/api/proxy.js` (Vercel) remove the `/api` and pass it to the tenant's backend. This also fixed the clash between the backend's `POST /chat` and the React `/chat` page.
- Mock router: hosted keys come from Render (`MOCK_KEY_TENANT_A/B`, random). The local keys are public in the repo, so they're refused when `NODE_ENV=production`.
- Added `/health` to the backend and mock router, and "School demo: please don't use a real password." on the Signup page.
- Tested locally: signup, duplicate email, wrong password, login, logout, Tenant A's login rejected on Tenant B, chat through the mock router, the proxy passing the cookie, and both production safety checks.

**Watch out**
- Render's free disk is wiped on restart, so a hosted backend refuses to start without `DB_URL`.
- Render free services sleep after ~15 min. The first request can take up to a minute (the proxy waits up to 60 s).

## 2026-10-27

**Done**
- Connected Tenant A to the partner's real router (https://lumen-roan-two.vercel.app). The key is only in `server/.env.tenantA` (gitignored), and in the Render dashboard once hosted. Tenant B stays on the mock router (no key yet).
- Real API shapes (from their docs page and `test1ref.webp`): chat reply `{ request_id, answer "[1]", sources [{ document_id, chunk_id, score }], route, usage }`. Feedback `{ request_id, rating: 1 | -1 }` → 204 with no body. Errors `{ error: { code, message } }`. The mock router now matches these exactly.
- Chat page uses the backend now (no more fake answers). Sources are numbered to match `[1]` in the answer. Thumbs buttons send that answer's `request_id`.
- `/chat` and `/feedback` now need a login, because each real question costs money and the backend will be public.
- Tested: real answers for enrollment and scholarship GWA (3.50, matches facts.md), 👍 accepted (204), bad rating 400, logged out 401, too-long question 400, the proxy passing a 204 through.

**What broke**
- First feedback test: 422 "Invalid request: rating." The real router wants 1 / -1, not "up" / "down". Fix: the backend translates.
- A GET to `/v1/feedback` said 404, which looked like "no feedback endpoint". It's POST-only. Lesson: test with the right method.
- A 204 reply has no body, so `res.json()` would crash in the backend, the Vercel proxy and the browser. All three now handle 204.
