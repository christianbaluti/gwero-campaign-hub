# Gwero OS

Gwero OS is a MySQL-backed operating system for prospecting, client relationships, campaigns, delivery, finance and people operations.

The campaign module supports contact-level audiences, categories and search, multi-step email/task sequences, approval gates, scheduling, daily delivery limits, suppression and unsubscribe handling, automatic stop-on-reply, attachments, personalisation, retries, audit history, open/click/reply tracking and client-conversion reporting.

## Development

Use Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

Configure MySQL using `.env.example` as a guide, then create the schema with `npm run db:migrate` before starting the app. On macOS, the local MariaDB socket and your current account work by default. For hosted MySQL, set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in a private `.env` file. Attachments are stored in MySQL with their metadata; include them in database backups. Never commit database credentials or mailbox passwords.

Existing data in an earlier database is not automatically copied. Export and migrate it separately before retiring that database. Gmail and Microsoft OAuth also require their own provider credentials and redirect URI setup.

## Background jobs

Set `CRON_SECRET` and call the protected job endpoint every 1–5 minutes so scheduled campaigns, delayed sequence steps and unread-notification emails continue even when nobody has the app open:

```sh
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://os.gwerosolutions.com/api/cron/notifications
```

The campaign-only endpoint is `/api/cron/campaigns`. Both endpoints are idempotent and use recipient-level claims, retry limits and daily campaign limits.

## Production

```sh
npm run build
npm start
```
