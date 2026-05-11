# ThreatLens

AI-enhanced cybersecurity and digital risk intelligence platform with a hybrid **rule engine + analyst-style AI** pipeline, premium dashboard UI, PostgreSQL-backed workflows, and **email OTP** for production-style authentication.

## Architecture

- **apps/web** — React (Vite), Tailwind CSS, Framer Motion, React Router, Axios, Recharts, react-hot-toast
- **apps/api** — Express (TypeScript), Prisma ORM, JWT + bcrypt, Zod validation, rate limits, OTP (bcrypt-hashed codes), Nodemailer/Resend/console mail
- **PostgreSQL** — users, OTP challenges + audit logs, threat scans/results (with confidence + classifications), enriched threat alerts, activity logs, risk scores

## Prerequisites

- Node.js 20+
- Docker (optional, for local PostgreSQL)

## Quick start

1. **Start Postgres** (from repo root):

   ```bash
   docker compose up -d
   ```

2. **Configure API** — copy [`apps/api/.env.example`](apps/api/.env.example) to `apps/api/.env` and set `DATABASE_URL`, `JWT_SECRET`, and mail/OTP variables. For local interviews, `EMAIL_PROVIDER=console` prints OTP codes to the API terminal.

3. **Configure web** — copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env`.

4. **Install and migrate**:

   ```bash
   npm install
   npm run db:push
   npm run db:seed
   ```

5. **Run dev servers**:

   ```bash
   npm run dev
   ```

   - API: `http://localhost:4000`
   - Web: `http://localhost:5173`

## Authentication (OTP)

- **Register** — creates the user (bcrypt password) then emails a one-time code; `POST /api/auth/verify-otp` completes verification and returns JWT.
- **Login** — validates password, emails OTP, same verify endpoint.
- **Resend** — `POST /api/auth/resend-otp` with cooldown + hourly send caps (see env).
- OTP rows, attempts, and audit events are stored for **pgAdmin-visible** security telemetry.

## Demo seed (pgAdmin-friendly)

After `npm run db:seed`, demo operators (password **`DemoPass123!`**):

- `demo@threatlens.dev`
- `soc@threatlens.dev`
- `analyst@threatlens.dev`

Includes historical scans, intel bulletins, OTP audit samples, and activity logs.

## API surface (selected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Start registration (OTP emailed) |
| POST | `/api/auth/login` | Start login (OTP emailed) |
| POST | `/api/auth/verify-otp` | Verify OTP → JWT |
| POST | `/api/auth/resend-otp` | Resend OTP (rate limited) |
| GET | `/api/auth/me` | Current user (JWT) |
| POST | `/api/scans` | Run hybrid threat scan |
| GET | `/api/scans` | Scan history |
| GET | `/api/scans/:id` | Scan detail |
| GET | `/api/dashboard` | Dashboard aggregates + charts |
| GET | `/api/analytics/risk-score` | Latest risk score |
| GET | `/api/feed` | Threat intel list |
| GET | `/api/feed/:id` | Full bulletin (modal/detail) |

## Deployment

- **Frontend (Vercel)** — project root `apps/web`, build `npm run build`, output `dist`, set `VITE_API_URL` to your Render API URL.
- **Backend (Render)** — set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and production `EMAIL_PROVIDER` (`resend` or `smtp`) with valid credentials.

## Notes

- Threat Simulation Lab provides interactive training scenarios for phishing, BEC, and narrative-style social engineering.
- Without AI API keys, analyst text uses a **structured fallback** tied to live rule signals.
