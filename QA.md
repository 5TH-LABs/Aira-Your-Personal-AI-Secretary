# Application verification — 30 October 2026

Branch: `feat/refinement`. Local source implementation and real-service acceptance are reported separately.

## Automated source and database checks

`npm run verify` passes TypeScript, lint with **zero errors** (three existing recorder-hook warnings), and **55 automated tests**. The suite covers exact decimal calculations, bill arithmetic/delivery/duplicates, payroll deductions/source periods, payment balances/references, separate receipts/disbursements, site cost reporting, explainable unusual-expense baselines, role/company filtering, malformed inputs, offline persistence/replay/conflicts, incremental tombstones and permission refresh, source quotation validation, cancellation, encrypted credentials, Google transport behavior and voice navigation boundaries.

The database suite applies all **22 migrations** to embedded PostgreSQL (PGlite with pgcrypto), executes real SQL/RLS/RPC policies using owner/staff/nonmember/service-role identities, and checks:

- operation replay and allowance deduplication;
- inaccessible approvals/jobs/company records and missing MFA;
- duplicate/stale approvals and immutable posted entries;
- assigned-staff task completion;
- payment posting above the remaining invoice balance;
- combined approval and durable child jobs;
- frozen attachments, immutable source uploads and edited-draft cancellation;
- expired email leases becoming uncertain;
- restoration of a database backup into a separate database.

This is a real SQL policy/execution test, **not a live Supabase Auth/Storage or production restore drill**. API tests use injected transports; they do not prove account/service provisioning.

## Browser

Five Playwright tests run the actual compiled React Native Web interface at 390 × 844 with **mock Auth/API transport**. They sign into the shared-company shell, open the fourteen specialists, enter/save valid forms, navigate/reload data views, calculate a 3.5 × 123.45 estimate as 432.08, calculate a 5,500 gross/5,000 net payroll and queue its review, capture/search a document through the persistent file queue, restore a company view after browser reload, and sign out back to the separate device workspace. The directory footer remains in the viewport and the page has no horizontal overflow. `qa/cloud-agents.png` records its visual layout.

These UI tests exercise real components/storage but do not demonstrate a live shared server or actual mail delivery. Test bundles are isolated under ignored `qa/cloud-ui`. Normal bundles are rebuilt with a cleared cache afterward. Generated bundles are scanned for server secrets and fake test configuration.

Earlier device-demo browser checks covered all five tabs, delivery discrepancy, edited/rejected local approvals, task persistence, original document retrieval and synthetic English recording → live Gemini transcription → editable transcript → navigation. Permission denial and cancellation were checked in that demo. Those results do not replace authenticated/native integration tests.

A separate live Gemini smoke check successfully prepared a personal note through the server master/provider interface, with in-memory records and no external sending. It verifies model access and structured proposal generation, not live database persistence.

## Native Android emulator

The laptop runs a standalone compact Pixel 5 Android 16/API 36 Google APIs x86_64 window, 4 GB RAM, four cores and automatic graphics. Windows Hypervisor Platform acceleration is usable; compatible SDK 57 Expo Go is installed.

The current source has loaded in the actual emulator. Home, the fourteen-specialist directory, a specialist form and the retained chat render with native safe areas and bottom navigation. Local records from the earlier demo remain available. Startup after a cleared Metro cache takes noticeably longer than a warm launch; compilation completion is not used as a substitute for checking the rendered screen.

Previous native demo checks covered five tabs, bill review, permission denial, recording startup and cancellation without a released-recorder-object error. The full authenticated application still needs an EAS development build with real service configuration for MFA account links, push, camera/file/offline-restart and multi-device acceptance. No claim is made that all cloud workflows passed in Expo Go.

## Build outputs and devices

Android Hermes, iOS Hermes and browser bundles compile with Expo SDK 57. `expo install --check` verifies compatible dependencies. Bundle compilation is not APK/IPA signing, installation or device acceptance.

- **Browser:** automated shared UI with mock transport; earlier live local AI/voice checks as described.
- **Emulator:** real native Expo Go smoke check, separate from cloud integration acceptance.
- **Physical Android:** not tested; previously deferred in favor of the laptop emulator. See ANDROID_TESTING.md.
- **iOS:** bundle compilation only; no iOS device/simulator or signed distribution test.
- **Sinhala:** selectable voice input; not validated with a Sinhala speaker.

## Required live pilot gates

CLOUD_SETUP.md prepares these steps, which remain unverified until the client's accounts exist:

1. Live Supabase migrations/Auth/SMTP/invitation/recovery/MFA and private original-file access.
2. Owner and supervisor on separate devices; unauthorized site/HR/payroll rejection; native offline restart, attachment persistence, single sync and concurrent-edit conflict recovery.
3. Gmail consent/refresh/revoke/reconnect, approved content/attachments only, 30-day/incremental inbox, uncertain-result reconciliation, and retrievable Drive archives.
4. Deployed Render worker processing jobs and reminders while laptop/phone are closed; actual push delivery with configured FCM/APNs.
5. Client-reviewed rates/statutory settings, invoice/BOQ/wage/payment/contract/permit/report/audit scenarios with real company evidence.
6. Supabase database/Auth plus encrypted-original restore into a separate project, signed Android development/preview APK, and iOS provisioning/runtime checks.
7. Human English/Sinhala recording, keyboard/scrolling/accessibility/reduced motion on target devices and Google OAuth production readiness.

No Supabase/Render/Google/EAS production service or signed APK/IPA is represented as already deployed. Public store publication, bank transfers, statutory submission and direct WhatsApp Business remain outside this release scope.

## Email drafting regression fix

The device chat previously replaced its route when submitting, which discarded in-flight reply state. A persistent device-office provider now owns records and request state across routes. Interrupted requests are exposed with Retry request after restart; original attachments are retained by reference. Company-wide letters accept no site and can defer recipients to review; task validation remains strict. The review saves the exact edited subject, audience and body.

The original company-wide work-from-home request reproduced the old API rejection and now returns a complete letter action using live Gemini. Three browser reproductions failed before the fix. All ten browser tests now pass, including Home/Chat submission, switching tabs while waiting, reload persistence, error/retry, edited approvals and the existing shared-company workflows. Sixty-one automated tests and TypeScript pass; lint has no errors. The normal web bundle has been rebuilt after the test bundle. This fix has browser evidence; no additional physical-device or live Gmail-send acceptance is claimed.

Live preview follow-up: the exact work-from-home request was submitted through the real app and local Gemini server. A letter action appeared, its subject/audience/body were visible in review, and the browser subsequently showed the approved draft in Documents. Screenshot: qa/email-fixed.png. No Gmail delivery was performed.

## Prompt-control audit update

See DEMO_AUDIT.md for the current audit. The expanded application passes 84 automated checks and 23 browser checks. This includes safe proposal application, stale and duplicate reviews, shared specialist records, site/task/estimate workflows, file-byte preservation, actual browser recording/transcript editing, denied permissions/cancellation, owner-only historical imports and dependent sync operations. All 23 database migrations execute in the embedded PostgreSQL suite. A real Gemini transcription of synthetic English audio returned Open permits and selected the correct workflow. Human voice/Sinhala and physical-device acceptance remain separate.

A Windows Metro open-file failure was found during simultaneous Android/web loading. The new Metro configuration bounds cache I/O without changing Expo's transform format. Final computer-control interaction was stopped by the physical Escape key; no further UI interaction was issued afterward.

After the Windows cache fix, simultaneous Android and web development-bundle requests both returned HTTP 200 (18.4 MB and 16.0 MB) without another open-file error. The demo API reports Gemini connected. The restarted demo uses BROWSER=none so it does not take over an open screen.
