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
├── server/                   # Express backend: /config, /chat, /feedback, /auth/...
│   ├── auth.js               # accounts: SQLite database + bcrypt + login cookie
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
