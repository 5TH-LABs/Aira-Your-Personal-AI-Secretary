# Site Office cloud activation

All application modules and migrations are supplied. No Supabase, Render, Google Cloud or Expo/EAS project has been created for this client yet. Complete these steps in development before importing client data. This guide does not claim a live deployment.

## 1. Prepare configuration and database

Run with Node 24+:

```sh
npm run cloud:prepare
npm run cloud:sql
npm run cloud:check
```

`cloud:prepare` preserves existing credentials and appends missing fields to the ignored `.env`, including separate random integration-token and backup encryption keys. Keep those keys securely outside the laptop as well. `cloud:check` prints only configured/missing status. `cloud:sql` combines **all ordered migrations** into `qa/supabase-setup.sql` for a new project; do not run only the first migration.

Create a Supabase project for development. Stop the API/worker while applying the full SQL file in SQL Editor. Enable the migration's `pgcrypto` extension if prompted. For an existing installation, apply only unapplied numbered migrations, in order, after taking a backup. The migrations create company records, RLS, role/site policies, a private `office-originals` bucket, mutation/sync RPCs, approvals, jobs, integration metadata and allowances.

Set these values locally:

| Server only | Mobile public settings |
| --- | --- |
| `SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` (same URL) |
| `SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Never include the service key in mobile settings |
| `GEMINI_API_KEY`, optional `GEMINI_MODEL` | Never include the Gemini key |

The server defaults to `gemini-3.5-flash-lite`; the model is configurable. Configure `EXPO_PUBLIC_API_URL` as the deployed **HTTPS origin** for installed preview builds. During LAN development leave it blank to follow Expo's advertised host. Restart Expo with `--clear` after changing public environment values.

## 2. Accounts, recovery and first owner

Disable public sign-ups for the pilot. Configure a transactional SMTP provider in Supabase Auth, including the sender domain; the default test mail service is not a production account-mail solution. Create the first owner in the Supabase Auth dashboard and give that person access to set their password.

Add `winklabz://account` to allowed Auth redirect URLs. Set `AUTH_REDIRECT_URI=winklabz://account` on the API and `EXPO_PUBLIC_AUTH_REDIRECT_URL=winklabz://account` on the app. For browser recovery, additionally allow the exact HTTPS preview `/account` URL and use that browser redirect value for its build.

The account link handler accepts PKCE `code`, `token_hash` for `invite`/`recovery`, and Supabase's access/refresh-token callback. Native token-hash templates can use `winklabz://account?token_hash={{ .TokenHash }}&type=invite` (or `type=recovery`). Test actual emails/deep links on the installed build before the pilot; Expo Go is not the custom-scheme acceptance target.

In the app, open Profile → Company workspace, sign in, then create the company. Set the owner's name and company letterhead. Enroll an authenticator in Account security, save its setup securely, and verify a six-digit code. The verified session is required for approvals and sensitive owner operations. Invite each office manager/accountant/supervisor/staff member from the company profile, assigning supervisor sites. HR and payroll remain separately restricted.

Use a second account/device to verify task sharing and reject unauthorized site/payroll reads. Add real sites and staff before importing historical data. The explicit resumable legacy import preserves the old source; sample records do not silently become company records.

## 3. API and background worker on Render

`render.yaml` declares the web API and persistent worker. Connect this checkout to a private GitHub/GitLab/Bitbucket repository and push the intended revision before creating a Render Blueprint. This checkout currently has no Git remote; no source has been pushed or service deployed by this implementation.

Create a Blueprint in [Render](https://dashboard.render.com/select-repo?type=blueprint). Use Node 24 as specified. Set server environment values on **both services** where listed. The API and worker must share the same Supabase service credential, Google credentials and `INTEGRATION_ENCRYPTION_KEY`. Set `GEMINI_MODEL` on both when overriding the default. If Expo push-token security is enabled, set `EXPO_ACCESS_TOKEN` on the worker.

Use an always-running worker plan for schedules; the worker polls jobs and updates its heartbeat. Do not replace it with a process tied to the phone or a laptop terminal. The API's `/api/status` is a public liveness/configuration summary, not proof that Gmail or every dependency is healthy. The authenticated owner view exposes worker heartbeat, integration status, failed/uncertain jobs, sync backlog and usage.

Local development uses `npm run demo:lan` plus `npm run worker` in a separate terminal after cloud configuration. Production runs `node server/index.mjs` and `npm run worker`. `/api/status`, `/api/assistant`, `/api/transcribe` are preserved; production AI routes require authenticated company access. Versioned record/sync/upload/run/review/integration/notice/usage operations live under `/api/v1/`.

## 4. Google mailbox and Drive

Create a Google Cloud project, enable Gmail and Drive APIs and configure OAuth consent. Create a **web application** OAuth client. Register the exact callback:

```text
https://YOUR-API/api/v1/google/callback
```

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` on API and worker. The owner signs in with verified MFA and selects Connect Gmail & Drive from company profile. OAuth requests Gmail read/send and Drive `drive.file` access; the application uses one company mailbox and app-created/selected files. Server refresh credentials are encrypted using AES-256-GCM. Keep the encryption key unchanged across service restarts/deployments.

Initially add the owner as an OAuth test user. Google consent-screen verification and production readiness for the requested scopes are release prerequisites; do not claim that adding test users completes that process. Verify token refresh/revocation/reconnect in staging. Confirm the first 30-day import, incremental refresh, threads/attachments, approved replies and retrievable Drive archives. Revoked access must show reconnect, while private source records remain available.

Test sends only to an explicitly chosen staging mailbox. Inspect exact recipients, subject, body and attachments before approving. Reconcile any uncertain result against Gmail Sent using the provider message ID before considering a retry. Never retry an ambiguous send blindly. Approve external reminder recipients/templates/schedule before activation.

## 5. EAS development and Android preview

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile development
```

Link the client's EAS project and configure Android FCM v1 push credentials. Install the resulting APK on the emulator/device. Configure the public Supabase/API values in the build environment; service keys stay on Render. For a local development client:

```sh
npm run demo:dev
npm run emulator -- --dev-client
```

For a self-contained pilot APK using the deployed API:

```sh
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` defines internal development and APK preview profiles. iOS uses the same source and requires Apple provisioning for signed device distribution. Configure APNs credentials for iOS push. Expo Go can demonstrate bundled features but cannot verify remote push or custom-scheme account links. No signed APK/IPA or EAS job has been produced without these accounts.

## 6. Backups and restore drill

Enable appropriate Supabase database/auth backups and retention for the chosen plan. Private storage objects require a separate backup; database snapshots do not contain their bytes. Run:

```sh
npm run backup:files
```

This writes AES-GCM encrypted originals and an encrypted metadata manifest under ignored `.private-backups/`. Copy the encrypted directory to managed backup storage and retain `BACKUP_ENCRYPTION_KEY` separately. Preserve the matching database snapshot, integration key and required Auth configuration.

For a drill, restore the database/auth snapshot into a **separate project**, create its private bucket, set `RESTORE_SUPABASE_URL`, `RESTORE_SUPABASE_SERVICE_ROLE_KEY`, and `RESTORE_CONFIRM_HOST` to that target's exact host, then run:

```sh
npm run backup:files -- --restore .private-backups/BACKUP_DIRECTORY
```

The script refuses the source host and existing-object overwrites. Start the restored API/worker with external integrations disabled; verify permissions, files, balances and job history before re-enabling delivery. An embedded PostgreSQL backup/restore test passes, but this real Supabase/storage/Auth restore drill remains a required pilot check.

Official references: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Render workers](https://render.com/docs/background-workers), [Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync), [Google scope review](https://developers.google.com/workspace/gmail/api/auth/scopes), [EAS internal builds](https://docs.expo.dev/build/internal-distribution/).
