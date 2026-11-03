# Flowy Sign

Original-brand eSignature + fax workspace (not a Dropbox clone).

## Features

- Auth (login / signup / session cookies)
- Documents + signature request flow + public `/sign/[token]` page
- Fax send/receive inbox (simulated carrier)
- Team invites & roles
- **Hidden admin** at `/admin/login` (not linked from the public site)
- MongoDB for admin accounts + site data
- Stripe subscriptions (monthly/yearly) with demo fallback
- Flowy Assist chatbot

## Demo app accounts (main site)

- `admin@lowysign.com` / `admin123`
<<<<<<< HEAD
- f`user@lowysign.com` / `user123`
=======
f- `user@lowysign.com` / `user123`
>>>>>>> fc658de7023a79e9803ca889a96123ed0799ff33

## Hidden admin

1. Start MongoDB (`docker compose up -d` or local Mongo)
2. Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
3. Seed login: `superadmin@flowysign.com` / `Admin@12345`
4. Admin signup is disabled (login only)

## Run locally

```bash
docker compose up -d
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `MONGODB_URI` in `.env.local` (see `.env.example`).

## Deploy

### Vercel

```bash
npx vercel --prod
```

Set the same env vars as `.env.example` in the Vercel project (especially `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`).

### Hostinger (VPS / Node / Docker)

Shared PHP hosting will not run this app. Use **VPS** or **Node.js** hosting.

**Option A — Node standalone**

```bash
npm ci
npm run hostinger:build
```

Upload the contents of `.next/standalone` to the server (it already includes `.next/static` + `public` after prepare). Then:

```bash
export PORT=3000 HOSTNAME=0.0.0.0
# also set MONGODB_URI, AUTH_SECRET, ADMIN_AUTH_SECRET, NEXT_PUBLIC_APP_URL, Stripe keys…
node server.js
```

Or from the project root after build: `npm run start:standalone`.

**Option B — Docker**

```bash
docker build -t flowy-sign .
docker run -p 3000:3000 --env-file .env.local flowy-sign
```

Point the Hostinger reverse proxy / domain to port `3000`.
