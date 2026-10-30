# Site Office — Complete package

Expo SDK 57 / React Native / TypeScript application for one construction company with multiple sites. Android, iOS and browser share the application source. The Aura-inspired five-tab interface retains Home, Chat, Agents, Activity and Profile. Branch: `feat/refinement`.

The repository now contains the Complete application implementation: company accounts and roles, all 14 specialist workflows, a server-coordinated master/personal assistant, offline capture/sync, exact-revision owner approvals, Gmail/Drive integration, a durable worker, notifications and usage allowances. Live cloud services have **not** been provisioned. The laptop opens a clearly labelled device demo until a company is configured; it does not pretend to share records or send mail.

## Open the laptop demo

Use Node 24 or later. From this directory:

```sh
npm ci
npm run demo:lan
```

Open http://localhost:8081. In a second terminal, run `npm run emulator` to open the compact Android Pixel 5 window. The launcher checks acceleration and uses the installed SDK 57 Expo Go. The API runs on port 4184 and Expo on 8081. LAN discovery uses the active network address rather than a fixed IP. Keep the laptop running for this local demo.

For voice, tap the microphone, allow permission, choose English/Sinhala/Auto, record, then edit the transcript before using it. “Open bills” navigates directly; work requests produce reviewable proposals. Owner approvals and financial posting in the shared company require internet access. Sinhala needs validation with a speaker.

[ANDROID_TESTING.md](ANDROID_TESTING.md) covers the phone QR sequence, network troubleshooting and emulator. [CLOUD_SETUP.md](CLOUD_SETUP.md) covers service activation and native development/preview builds.

## Prompt and voice control in the device demo

The fourteen specialist workflows and Chat now share device records. The assistant can prepare create/update/archive actions, search/open records, and navigate the app from typed requests or reviewed voice transcripts. Changes are reviewed before applying; stale revisions and changed source records require a new review. File originals remain available after interpretation. See [DEMO_AUDIT.md](DEMO_AUDIT.md) for rehearsed prompts, fixes and verification limits.

## Complete workflows

| Area | Workflows |
| --- | --- |
| Master and personal assistant | Permission-filtered server records, bounded Gemini plans, persisted steps/sources/proposals, cancellation, combined reviews, briefings, notes, meetings and reminders. |
| Documents: five specialists | Editable letters/email and PDF export; private filing/classification/search and Drive archive; cited contract clauses/obligations; permit/insurance expiry/renewal tracking; daily reports using recorded progress, photos and notes. |
| People: five specialists | Assigned tasks/status/follow-ups; shared plans/dependencies/handovers; attendance corrections, wage policies and payroll batches; staff/leave/contracts/statutory reminders; subcontract milestones/certification/payment schedules/history. |
| Money: four specialists | Multi-line BOQs/estimates/rates; invoice arithmetic/delivery/duplicate checks; expenses, customer invoices, cashbook and project balances; explainable audit findings and investigation records. |
| Payments | Reviewed bank instructions/CSV exports, approved payment plans, actual payment records with bank references and balance reconciliation. No bank transfers are initiated. |

AI extracts and explains; decimal arithmetic computes totals. Users verify extracted facts before posting. Wage/statutory rates are explicit effective-dated company settings, not assumed legal advice. Prepared payment plans do not count as paid invoices.

## Shared company and offline work

Supabase provides email/password accounts, recovery, owner TOTP MFA, roles, private originals and PostgreSQL records. API and row-level database policies restrict company, site, staff and payroll access. Owners approve external sends, financial posting and deletion; editable records carry versions. Changing a reviewed record or attachment invalidates its approval.

Native records use SQLite; browser records use IndexedDB through the same repository. Task drafts, notes, attendance and photos can be captured offline. A persisted operation queue syncs on reconnect/foreground and exposes pending, failed and conflicting edits. Operation IDs prevent replayed mutations. Membership changes trigger an authoritative permission-filtered refresh. Financial posting, approval, sending and AI require connectivity.

The original device demo remains separate. Profile offers an explicit resumable import into the authenticated company. Originals and source records are retained; historical undated activity stays undated. Import does not turn old local decisions into authorized cloud actions.

## Background execution

The Node API and separate Render worker use PostgreSQL jobs with leases, deduplication and persisted outcomes. Gmail imports the latest 30 days and then refreshes incrementally every five minutes or on demand. Mail sends use the frozen reviewed recipients/content/attachments. Ambiguous sends become **uncertain** and require reconciliation, rather than blind retries. Drive archives are revision-idempotent, and failures remain visible while private originals/search stay available.

Complete allowances are 250 new letters/email drafts, 1,000 documents and 300 bill-check revisions per company month, plus 150 active staff. Successful new units count once; retries do not count again. The owner sees 80% warnings and can add allowances. Reminders and inbox refresh have no package quota. Owner-approved external reminder schedules are separate from internal notices. Push needs an installed development/preview build and configured Expo/FCM/APNs credentials.

## Source map and validation

- `src/app/`: Expo Router routes; `src/features/office/`: device demo and authenticated shared shell.
- `src/features/records/`: mobile forms and readable review details; `src/features/workspace/`: accounts, MFA, import and company settings.
- `src/shared/`: runtime models, permissions, decimal domain rules and agent tools; `src/storage/`: SQLite/IndexedDB repository and sync.
- `server/`: authenticated API, authoritative AI context, Google OAuth, mail/Drive and durable worker.
- `supabase/migrations/`: ordered database migrations, RLS, versioned mutations, approvals, usage and jobs.
- `render.yaml`, `eas.json`: cloud service and native build configuration.

```sh
npm run verify
npm run test:ui
npx expo export --platform all --clear --output-dir dist
npm run cloud:sql
npm run cloud:check
```

UI tests compile a **test-only** bundle with mock transport. Rebuild the normal bundles with `--clear` afterward so its fake configuration cannot carry into the demo. See [QA.md](QA.md) for separate database, browser, emulator and physical-device evidence. [IMPLEMENTATION.md](IMPLEMENTATION.md) distinguishes implemented source from external activation and pilot gates.

Only server processes read Gemini, Supabase service-role and Google secrets. Never put those in `EXPO_PUBLIC_*`. `.env`, original-file backups, generated QA output and build output are ignored. Keep separate secure copies of both encryption keys.
