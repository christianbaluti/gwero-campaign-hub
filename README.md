# Gwero Campaign Hub

Make a web app for CRM. I will be uploading excel files for prospect clients, mark places for client name, email, etc. Then I can draft an email with placeholders, attachments upload, CCs, BCCs etc then I send the campaign and can see the outcomes on the responses because we had connected the emails earliers. The email could be from any configuration includting smtp, imap etc. The app is Gwero CRM. You can add all the features to make sure this is end to end.

Gwero CRM is an independent prospect and email-campaign workspace. It supports prospect imports, personalised campaign drafts, SMTP sending, IMAP reply synchronisation, attachments, and open/click tracking.

## Development

Use Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

Configure MySQL using `.env.example` as a guide, then create the schema with `npm run db:migrate` before starting the app. On macOS, the local MariaDB socket and your current account work by default. For hosted MySQL, set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in a private `.env` file. Attachments are stored under `var/attachments` by default; back up that directory with the database. Never commit database credentials or mailbox passwords.

Existing data in an earlier database is not automatically copied. Export and migrate it separately before retiring that database. Gmail and Microsoft OAuth also require their own provider credentials and redirect URI setup.

## Production

```sh
npm run build
npm start
```
