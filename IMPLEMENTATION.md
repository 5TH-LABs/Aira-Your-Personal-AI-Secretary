# Complete application delivery ledger

Branch: `feat/refinement`. Updated 2026-10-30. This ledger separates source implementation from activation and real-service acceptance.

| Milestone | Implemented in this checkout | External acceptance still required |
| --- | --- | --- |
| Foundation | Expo Router/modules; accounts/recovery/TOTP; company/site/role policies; ordered migrations; shared validation; SQLite/IndexedDB offline queue; incremental sync/conflicts; original-file queue; resumable legacy import. | Live Supabase Auth/SMTP/deep links; two-account/two-device isolation and offline native restart tests. |
| Core office | Master/personal planner with permission-filtered server context; bounded specialist tools; run steps/sources/cancellation; exact-revision combined approvals; durable job execution; Gmail OAuth/inbox/replies/attachments; Drive archive; search/extraction; internal/push/external-approved reminders. | Real Google OAuth, sends/refresh/revoke/reconciliation/archives; deployed worker while app closed; real push device delivery. |
| People | Tasks/status, handovers/dependencies; staff/leave/contracts; explicit effective wage policies; attendance correction approvals; payroll source versions/double-use guards; subcontract certification/payment histories. | Company rate/EPF/ETF inputs reviewed by the client; realistic staff and payroll pilot data. |
| Money and documents | Exact decimal BOQs/rate libraries; invoice duplicates/arithmetic/delivery checks; expenses/invoices/payments/cashbook; payment instructions/exports and reconciliation; explainable audit findings; contract source quotations; permits/renewals; photo/note reports; Complete quotas/top-ups. | Client validation of source extraction and calculations; approved financial and document workflows with live shared storage. |
| Release engineering | Render API/worker Blueprint; EAS dev/preview settings; encrypted-original backup/restore utility; database restore test; owner health/job/usage views; CI and browser/domain/database tests. | Create accounts, connect/push repository, deploy, live restore drill, signed APK, physical Android, iOS device/signing and Sinhala speaker acceptance. |

All 14 specialists have operational shared-record forms and bounded AI proposal tools. The master coordinates proposals and persists their progress/results. Agent output is draft evidence, never authority to send/post/delete. Durable jobs execute owner-approved revisions and distinguish queued/completed/failed/uncertain/cancelled states. Ambiguous email delivery requires reconciliation.

The laptop's unconfigured workspace remains the labelled device demo. Signing into the configured company selects the full shared application. New cloud work does not overwrite historical local originals; import is explicit and resumable. Old undated activity is not assigned invented timestamps.

No application can pass live-cloud or signed-device acceptance before the client service accounts and credentials exist. The source setup is prepared in CLOUD_SETUP.md; no Google mailbox, Render service, Supabase production project or EAS build is claimed to be active.

Deliberate product boundaries: no bank-transfer initiation, no statutory filing submission, no direct WhatsApp Business delivery, no messaging add-on/subscription checkout and no public store publication. Payment instructions, recorded bank references, manual sharing and internal pilot APK configuration are included.
