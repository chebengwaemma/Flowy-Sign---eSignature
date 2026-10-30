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

- `admin@flowysign.com` / `admin123`
- `user@flowysign.com` / `user123`

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
