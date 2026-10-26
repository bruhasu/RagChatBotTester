# Multi-Tenant AI Help Desk: Test Website

A school project. This repo is the **test website**: a small fake business with a chatbot that uses an AI router service the way a paying customer would. The router itself (`POST /v1/chat`) is built separately by my project partner. Until it's ready, a **mock router** in this repo stands in for it.

The test website has three jobs:

1. **Prove the whole customer path works:** sign in, ask questions, see answers with their sources.
2. **Prove tenant isolation:** the same site runs as two separate businesses, and neither may ever see the other's documents.
3. **Produce realistic test data:** real-looking questions plus thumbs up / down feedback, used as labeled data for the router's classifier.

> ⚠️ **Both businesses are fictional.** Bagwis University and KahonKo Gadgets do not exist. All names, documents, dates, accounts and contact details are made up for this project. No real student or customer data is used anywhere.

## The two fictional businesses

One codebase runs twice. Only the settings change.

| | Tenant A | Tenant B |
|---|---|---|
| Name | **Bagwis University Help Desk** | **KahonKo Gadgets Support** |
| What it is | A university FAQ bot | An online shop for phone accessories |
| Colors | Navy blue + gold | Orange + white |
| Logo | Wing (`wing.svg`) | Box (`box.svg`) |
| Accounts | Own database (`server/data/tenantA.db`) | Own database (`server/data/tenantB.db`) |
| Website | http://localhost:5173 | http://localhost:5174 |
| Backend | port 4000 | port 4001 |

"Bagwis" means *wing* and "kahon" means *box* in Filipino.

## How it fits together

```
Browser (React site)  ->  our backend (server/)  ->  AI router (partner's service, or mock-router/)
                          holds the API key           answers questions from that tenant's documents only
```

The API key only ever lives in the backend. The browser never sees it.

## Folder structure

```
├── README.md
├── CLAUDE.md                 # detailed project rules and plan
├── notes.md                  # daily log: what we tried and what broke
├── Test website.pdf          # the project spec
├── client/                   # React website (Vite)
│   ├── public/               # images and logos
│   └── src/
│       ├── tenantConfig.js   # all branding and text for Tenant A and B
│       ├── homeContent.js    # Home page topics, dates, FAQs
│       ├── chatService.js    # where chat replies come from (fake for now)
│       ├── authService.js    # sign up / log in / log out (talks to the backend)
│       ├── weatherService.js # login page weather (Open-Meteo)
│       ├── pages/            # Login, Signup, Home, Chat, About (one folder each)
│       └── components/       # Navbar, Footer, AuthLayout, MessageBubble, TopicGrid, ...
├── render.yaml               # Render blueprint: mock router + one backend per tenant
├── client/api/proxy.js       # Vercel only: passes /api/... to the tenant's backend
├── client/vercel.json        # Vercel settings (rewrites /api/... to the proxy)
├── server/                   # Express backend: /config, /chat, /feedback, /auth/...
│   ├── auth.js               # accounts: SQLite file (local) or Turso (hosted) + bcrypt + login cookie
│   ├── data/                 # account databases, created on first start (never uploaded)
│   └── .env.example          # settings template (copy it, see below)
├── mock-router/              # fake AI router on port 3000
├── documents/                # (coming) fake documents for each tenant
└── tests/                    # (coming) pytest tenant isolation tests
```

## How to run it (Windows)

You need **Node.js 24** (https://nodejs.org). Use **PowerShell** (in VS Code: Terminal → New Terminal).

### 1. Install packages (once)

```powershell
cd mock-router; npm install; cd ..
cd server; npm install; cd ..
cd client; npm install; cd ..
```

### 2. Create the backend settings files (once)

The real settings files are not in this repo because they hold API keys. Make your own from the template:

```powershell
cd server
Copy-Item .env.example .env.tenantA
Copy-Item .env.example .env.tenantB
```

Then open each file and fill it in. For the **mock router**, use these test values:

| Setting | `.env.tenantA` | `.env.tenantB` |
|---|---|---|
| `PORT` | `4000` | `4001` |
| `ROUTER_API_URL` | `http://localhost:3000` | `http://localhost:3000` |
| `ROUTER_API_KEY` | `mock-key-tenant-a-bagwis` | `mock-key-tenant-b-kahonko` |
| `BRAND_NAME` | `Bagwis University Help Desk` | `KahonKo Gadgets Support` |
| `BRAND_PRIMARY_COLOR` | `"#1B2A4A"` | `"#C2410C"` |
| `BRAND_ACCENT_COLOR` | `"#D4AF37"` | `"#FFFFFF"` |
| `BRAND_LOGO` | `wing.svg` | `box.svg` |
| `TENANT_ID` | `tenantA` | `tenantB` |
| `DB_PATH` | `data/tenantA.db` | `data/tenantB.db` |

Keep the quotes around colors: in `.env` files, `#` starts a comment. The mock keys only work with the mock router, so they are safe to show here. **Never commit a real key.**

### 3. Start everything

Open one PowerShell terminal for each line:

```powershell
# Terminal 1: mock router (http://localhost:3000)
cd mock-router; npm start

# Terminal 2: backend for Tenant A (http://localhost:4000)
cd server; npm run start:a

# Terminal 3: backend for Tenant B (http://localhost:4001)
cd server; npm run start:b

# Terminal 4: website for Tenant A -> open http://localhost:5173
cd client; npm run dev:a

# Terminal 5: website for Tenant B -> open http://localhost:5174
cd client; npm run dev:b
```

Logging in needs the backend, so for Tenant A run Terminals 2 and 4, and for Tenant B run Terminals 3 and 5. Chat replies are still **fake** (see `client/src/chatService.js`). Stop anything with `Ctrl + C`.

**Accounts:** click **Create one** on the login page to make an account. Each business has its own accounts, so an account made on Tenant A does not work on Tenant B. Passwords are stored only as bcrypt hashes. This is a school project, so don't reuse a real password.

### Quick backend test

`curl.exe` (not `curl`, which is a PowerShell alias), with Terminals 1 and 2 running:

```powershell
curl.exe -X POST http://localhost:4000/chat -H "Content-Type: application/json" -d '{\"query\": \"When does enrollment close?\", \"sessionId\": \"test-1\"}'
```

You should get a JSON reply with an `answer` and `sources` tagged `tenantA`.

## Host it online (free)

```
Friend's browser -> Vercel site (Tenant A or B) --/api/...--> Render backend A or B -> Render mock router
                    one Vercel project per tenant              each with its OWN Turso database
```

- **Websites:** two Vercel projects from this repo (root folder `client`). `client/api/proxy.js` passes `/api/...` to that tenant's backend, so the site and the API share one address and the login cookie just works.
- **Backends + mock router:** three free Render services, created from `render.yaml`.
- **Accounts:** two separate Turso databases (`bagwis-accounts`, `kahonko-accounts`). Each backend only gets the token for its own database.
- **Secrets** (database URLs and tokens, router keys) live only in the Render and Vercel dashboards, never in this repo.

### 1. Turso (account databases)

1. Go to https://turso.tech, click **Sign up** and choose **Continue with GitHub**.
2. Create a database named `bagwis-accounts`. Pick the location closest to the Philippines.
3. On that database's page, copy its **URL** (it starts with `libsql://`). Save it in Notepad as *A URL*.
4. On the same page, create a **token** (read and write, no expiry) and copy it right away, because it's shown only once. Save it as *A TOKEN*.
5. Repeat steps 2 to 4 for a second database named `kahonko-accounts`: *B URL*, *B TOKEN*.

Don't save that Notepad file inside the project folder.

### 2. Render (backends + mock router)

1. Go to https://render.com and sign up with **GitHub**. Allow it to see the `RagChatBotTester` repo.
2. Click **New +** → **Blueprint**, then pick `bruhasu/RagChatBotTester` (branch `main`).
3. Render reads `render.yaml` and lists 3 services. It asks for `DB_URL` and `DB_AUTH_TOKEN`:
   - under **ragtester-backend-a**: *A URL* and *A TOKEN*
   - under **ragtester-backend-b**: *B URL* and *B TOKEN* (don't swap them!)
4. Click **Deploy Blueprint** and wait until all three services show **Live** (a few minutes).
5. Open **ragtester-mock-router** and look at its address at the top. If it isn't exactly `https://ragtester-mock-router.onrender.com`, open each backend → **Environment**, set `ROUTER_API_URL` to the real address, and click **Save**.
6. Copy the addresses of **ragtester-backend-a** and **ragtester-backend-b**.
7. Test: open `<backend-a address>/health` in your browser. You should see `{"ok":true,"tenant":"tenantA"}`. The first visit can take up to a minute.

### 3. Vercel (the two websites)

1. Go to https://vercel.com, sign up (**Hobby**) with **GitHub**.
2. Click **Add New…** → **Project** → **Import** next to `RagChatBotTester`.
3. Fill in:
   - **Project Name:** `bagwis-helpdesk`
   - **Framework Preset:** Vite
   - **Root Directory:** click **Edit**, pick `client`
   - **Build Command** (under Build and Output Settings): turn on the override, type `npm run build:a`
   - **Environment Variables:** Key `BACKEND_URL`, Value = the backend A address (no `/` at the end)
4. Click **Deploy**.
5. Repeat steps 2 to 4 for Tenant B: name `kahonko-support`, build command `npm run build:b`, `BACKEND_URL` = the backend B address.

### 4. Test the hosted sites

1. Wake everything up: open the three `/health` addresses and wait until each shows `"ok":true`.
2. Open the Bagwis site → **Create one** → you see "School demo: please don't use a real password." Sign up with a fake password, then log in. You should see "Welcome, <name>!".
3. Refresh the page: you're still logged in. Open `/chat` and refresh: the page still loads.
4. Open the KahonKo site and log in with the **same** email and password: you should get "Incorrect email or password." (the accounts are separate).
5. In Turso, open `bagwis-accounts` and look at the `users` table: only `tenantA` rows, and passwords only as hashes.

**Good to know:** free Render services sleep after about 15 minutes without visitors, so the first login after a break can take up to a minute. Every push to `main` redeploys Vercel and Render automatically. Chat replies on the site are still fake (see `client/src/chatService.js`).

## Document sources

The help desks answer from fake documents in `documents/tenantA/` and `documents/tenantB/`. **All of them are written by us** (AI drafts, edited by hand) and describe the fictional businesses only. Where each document came from and its license will be listed in `documents/SOURCES.md`.

*Status: the documents haven't been added yet.*

Other assets:

| What | Source | License |
|---|---|---|
| `wing.svg`, `box.svg` logos | Drawn for this project | Part of this project |
| Login banner images (`banner-1..3.jpg`) | Generated placeholders | Part of this project |
| Icons | [Lucide](https://lucide.dev) (`lucide-react`) | ISC |
| Weather on the login page | [Open-Meteo](https://open-meteo.com) | Data under CC BY 4.0 |

## Credits

A duo school project.

- **[YOUR NAME]**: test website (this repo): React site, backend, mock router, tests
- **[PARTNER'S NAME]**: AI router service (`POST /v1/chat`)

Weather data by [Open-Meteo.com](https://open-meteo.com/).
