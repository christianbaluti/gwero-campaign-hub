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

Copy `.env.example` to `.env` and provide your Supabase project values. Never commit service-role keys or mailbox passwords.

## Production

```sh
npm run build
npm start
```
