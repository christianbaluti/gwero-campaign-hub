# Gwero OS production delivery

## Canonical repository

`https://github.com/owenk-bonhoga/gwero-campaign-hub` is the shared production repository.
Owen and Christian should make new changes on branches in this repository and open pull requests
into `main`. The Christian repository is retained for historical work; changes pushed there are
not automatically copied into this repository.

Hostinger must watch `owenk-bonhoga/gwero-campaign-hub`, branch `main`. Reconnecting and verifying
that integration is a separate hosting task; passing repository CI does not establish a live deployment.

## Contribution and verification

1. Branch from the latest `main`, make regular commits, and open a pull request into `main`.
2. The protected branch requires an up-to-date `verify` check. CI checks repository safety,
   formatting, lint, types, tests, production dependency vulnerabilities, repeatable MySQL
   migrations, and the production build.
3. The existing trusted-source automation merges the exact verified pull request. It explicitly
   dispatches CI on `main`, because merges made with `GITHUB_TOKEN` do not trigger push workflows.
   Manual merges trigger main CI through the normal push event.
4. After main CI succeeds, `Deploy production` waits for Hostinger and verifies HTTP 200 and the
   exact merged SHA in `X-Release-Commit`. This workflow verifies deployment; it does not call a
   deployment webhook or reconnect Hostinger.
5. Hostinger installs from `package-lock.json`, runs `npm run build`, and starts with `npm start`.
   Production uses Node.js 22.

Local checks:

```bash
npm ci
npm run repository:check
npm run format:check
npm run lint
npm run typecheck
npm test
npm run security:audit -- --omit=dev
```

Use a separate test MySQL database for `npm run db:migrate`, `npm run db:verify`, and
`npm run deploy:build`. CI provisions its own MySQL service. Never use production credentials
for local verification or commit credentials, environment files, uploads, or database backups.

## Persistent data and rollback

Database and application environment variables remain in Hostinger. Attachments are stored in
MySQL; include them in database backups. Keep any legacy attachment directory outside the checkout.
The build applies checked-in, idempotent schema and security migrations before bundling.
Migrations do not drop, truncate, recreate, or seed the production database.

For code rollback, open a pull request reverting the bad merge, verify it, and merge it. Hostinger's
previous completed deployment remains an emergency application rollback; database migrations
are forward-only and idempotent. Do not rewrite published history or force-sync away production changes.
