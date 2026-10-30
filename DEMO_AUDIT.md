# Demo audit and prompt control

Branch: feat/refinement. Updated 30 October 2026.

## What the owner can say or type

Use Home/Chat or the microphone. Voice transcription is editable before the request is used. Simple navigation opens immediately. Record changes become editable approval cards; nothing is applied until the owner approves the reviewed changes.

- “Update Nugegoda Residence progress to 70 percent.”
- “Mark Upload first-floor slab photos as Done.”
- “Create an estimate for 3.5 cubic metres of concrete at Rs. 123.45 per cubic metre for Nugegoda Residence.”
- “Record Nimal Silva's attendance for today: eight regular hours at Rs. 500 per hour and two overtime hours at Rs. 750 per hour.”
- “Add an insurance permit for Nugegoda Residence, reference POL-100, expiring 2027-06-30.”
- “Create a site report for today: slab formwork inspected; the remaining ten cement bags are outstanding.”
- “Draft an email to all employees announcing work from home next week.”
- “Find delivery note DN-088.”
- “Open wages”, “Open permits”, “Open estimates”, “Open approvals”.
- “Update the site progress and add an inspection note” prepares a combined review.

The same bounded record tools cover all specialist record types: documents/letters/contracts/permits/reports, tasks/team plans/attendance/wages/HR/leave/subcontractors, estimates/rates/invoices/expenses/payment instructions/recorded payments/audit findings, and notes/meetings/reminders. Unknown staff, missing rates, invalid dates and unavailable sources require clarification. For PDFs, review the extracted text before using its page text for contract citations.

File selection, system permissions, final approval and platform sharing remain explicit user steps. The device demo does not send mail, move money or deliver reminders while the app is closed. The connected company worker provides background execution after service activation. Sinhala still requires a speaker acceptance check.

## Bugs corrected

- Reply/request state, typed drafts, attachments and selected site survive screen navigation.
- Specialist forms and Chat now use one view of device records, preserving the old specialist store as a migration source.
- Company-wide emails no longer require a construction site or invented task deadline.
- Prompt updates and deletions are version-bound proposals; rejection leaves records intact, and stale/duplicate decisions cannot apply silently.
- Bundles apply atomically; changed payroll/document/photo sources invalidate review. Posted financial entries and used attendance cannot be rewritten or posted twice.
- Site records remain company-level records and cannot become their own parent.
- The microphone is reachable from the main tabs; English capture, transcript edits, permission denial and recording/request cancellation are checked.
- Bill checks use decimal arithmetic, flag over-delivery as well as shortages, and agree at half-cent rounding boundaries. Financial inputs reject ambiguous hexadecimal/exponent syntax.
- Impossible dates and invalid delivered quantities are rejected in manual forms.
- PDF/image interpretation retains original file bytes; downloading an interpreted PDF returns the actual PDF, not extracted text under a PDF filename.
- Incomplete historical invoices produce audit findings instead of breaking every briefing.
- A cloud sync batch can reference records saved earlier in that batch.
- Specialist and review history can be imported into an owner-only, non-executable archive; historical payroll is not flattened into shared notes.
- Windows Metro cache I/O is bounded to prevent open-file exhaustion when Android and web compile together.

## Verification

84 automated tests pass; TypeScript passes; lint has no errors (three existing recorder-hook warnings). 23 browser tests pass, including shared-company workflows with mock transport and the device demo's real components/storage. Voice UI tests use synthetic browser capture and mock transcription. A separate real Gemini test transcribed synthetic English audio as “Open permits.” and routed it to the permits workflow. Three real Gemini planning checks produced site-progress, task-status and estimate proposals with a deterministic Rs. 432.08 estimate total.

Android, iOS and web bundles are rebuilt separately from UI test configuration. Native final visual interaction was stopped with the physical Escape key, so that portion of the check was stopped. Physical Android, iOS runtime, human microphone/Sinhala, cloud Gmail/Drive/push and signed APK acceptance remain separate from these local tests.

No claim is made that an audit proves the absence of every possible defect. Keep the demo to the rehearsed workflows and inspect proposed facts and amounts before approval.

After the Windows cache fix, simultaneous Android and web development-bundle requests both returned HTTP 200 (18.4 MB and 16.0 MB) without another open-file error. The demo API reports Gemini connected. The restarted demo uses BROWSER=none so it does not take over an open screen.
