# MEAVO Assembly

Install questionnaire tool for assembly partners. CS schedules deliveries in Google Sheets; this app mirrors assemblies and collects install checklists + photos.

## Local setup

```bash
cp .env.example .env
# Same DATABASE_URL as meavo-gateway

npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Shared Neon Postgres (same as gateway) |
| `AUTH_SECRET` | Session signing |
| `AUTH_URL` | `http://localhost:3001` / `https://assembly.meavo.app` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google SSO for MEAVO team |
| `ASSEMBLY_TOOL_CARD_ID` | `seed-assembly-tool` (gateway tool card) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Delivery tracker sheet |
| `GOOGLE_SHEETS_TAB_NAME` | `Deliveries` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account JSON (Viewer on sheet) |
| `CRON_SECRET` | Protects `/api/cron/import` |
| `BLOB_READ_WRITE_TOKEN` | Photo uploads |

## Deploy

1. New Vercel project from this repo
2. Same `DATABASE_URL` as gateway
3. Domain: `assembly.meavo.app`
4. Run `npm run db:push` once against shared DB (schema includes gateway + assembly tables)
5. Grant users access via gateway Admin → Assembly tool card
