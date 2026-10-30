# Mobile demo validation â€” 30 October 2026

## Build checks

- TypeScript passes. Thirteen automated tests pass: bill totals/delivery discrepancy/duplicates, one-time approval transitions, transcription validation/error handling, allowed action proposals, voice navigation, activity timestamp preservation/calendar boundaries, and LAN address selection.
- Android, iOS and web production bundles compile. iOS compilation is not a device runtime test.
- Gemini key remains in ignored server configuration. API contracts are preserved.

## Android emulator

Real Android 16/API 36 Google APIs x86_64 Pixel 5 running Expo Go SDK 57, 4 GB RAM, four cores, automatic graphics. Windows Hypervisor Platform acceleration passed. Compact standalone window opens using npm run emulator; both demo services must already be running.

Checked all five tabs, assistant connection and response, bill delivery discrepancy, four agent workflows, chat composer, existing activity under Earlier activity, and pending review access. Fixed a native-only layout problem in the Activity review banner caused by percentage width in the animated button contents. Android dark status icons and safe-area layout were visually inspected. Microphone permission denial displays instructions; recording starts with permission. Closing an active recording initially exposed a released-object error; native cleanup now relies on Expo's recorder ownership, and retesting confirmed that cancelling a live recording returns to Home without an error. Results and screenshots are saved in qa/.

## Browser

All five redesigned tabs work at 390px without horizontal overflow or JavaScript errors. Prior workflow checks cover a bill discrepancy, edited approval and unsent outbox, rejected history, a live Gemini task proposal and approved task creation, saved task persistence after reload, TXT upload/content search/original retrieval and daily report creation. New activity receives full dates; older undated records remain undated.

Synthetic English audio passed through browser capture, real Gemini transcription, editable review and Open bills navigation. Permission denial and cancellation were also checked. Human laptop speech and Sinhala recognition still require a speaker test.

## Physical devices

Physical Android phone testing is deferred at the user's request to use the laptop emulator now. ANDROID_TESTING.md provides the same-Wi-Fi Expo Go sequence, QR setup, private-network firewall guidance, SDK compatibility and separate AI server troubleshooting. No physical iOS runtime, signed APK/IPA, hardware frame-rate measurement, or Sinhala speaker verification has been performed.

Recorder lifecycle reference: [Expo SDK 57 Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/). Installed SDK source confirms the hook owns native recorder disposal.
