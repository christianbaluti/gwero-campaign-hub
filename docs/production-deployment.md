# Gwero OS production delivery

## Repository roles

- `origin`: `https://github.com/owenk-bonhoga/gwero-campaign-hub.git` — reviewed production repository.
- `upstream`: `https://github.com/christianbaluti/gwero-campaign-hub.git` — source repository only.
- Production branch: `origin/main`.
- Hostinger must watch only `owenk-bonhoga/gwero-campaign-hub`, branch `main`.

## Production gate

1. Changes enter Owen `main` only through a pull request.
2. The `CI / verify` check and one approving review are required before merge.
3. The production workflow runs only when the `CI` workflow succeeds for Owen `main`.
4. The production workflow calls the Hostinger deployment webhook stored as the
   `HOSTINGER_DEPLOY_WEBHOOK` GitHub Actions secret. The secret must never be committed or logged.
5. Hostinger installs from the lockfile, runs `npm run build`, and starts with `npm start`.
6. `npm run build` applies the checked-in, idempotent MySQL schema and security migrations before
   building. The scripts never drop, truncate, recreate, or seed the production database.
7. The workflow waits until `https://os.gwerosolutions.com` returns HTTP 200 and the exact merged
   SHA in `X-Release-Commit`.

Only one production deployment may run at once. The workflow deliberately does not cancel a running
deployment when a newer one is queued.

## Persistent data and rollback

`ATTACHMENT_DIR` must point outside the application checkout so replacing application files does not
remove uploads. Database and application environment variables remain in Hostinger and are not
copied into GitHub.

For code rollback, open a pull request that reverts the bad merge commit. Passing CI and merging the
revert deploys a new, auditable commit. Hostinger's previous completed deployment remains available
as the emergency application rollback, but database changes are forward-only and idempotent.

## Synchronizing future upstream work

```bash
git fetch upstream --prune
git fetch origin --prune
git switch -c sync/upstream-YYYYMMDD origin/main
git merge --no-ff upstream/main
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run repository:check
npm run security:audit
git push -u origin sync/upstream-YYYYMMDD
```

Review the diff and preserve Owen-only security and deployment files. Open a pull request into Owen
`main`, wait for CI and approval, then merge. Never deploy the Christian repository directly.
