# Site Office mobile

React Native + Expo SDK 57 + TypeScript, sharing the same screens and logic across Android, iOS and the laptop preview. This is native React Native source, not a WebView wrapper around the previous website.

The mobile UI follows the client-supplied personal assistant reference: soft white cards, navy text, violet accents and quiet lavender gradients, Manrope type and Phosphor icons. The five tabs are Home, Chat, Agents, Activity and Profile. Bills, tasks and approvals remain accessible through agent cards and home overview rows. At desktop widths, the same app appears inside an interactive phone frame.

## Start the laptop demo

```sh
npm install
npm run demo
```

Open http://localhost:8081. The script starts the private local API on port 4184 and the Expo preview on port 8081. Keep the processes running during the demo. Microphone recording requires localhost or HTTPS on browsers.

The existing Gemini key was copied to this project's ignored `.env`. Only the server reads it; it is not included in client bundles. `.env.example` documents the values. Never put the key in an `EXPO_PUBLIC_` variable.

Alternatively run `npm run api` and `npm run web` in two terminals.

## Voice demo

1. Tap the microphone beside the message box on Home or Chat (also available on Agents and workflow headers).
2. Allow microphone access, choose Auto/English/Sinhala, then record a short request (up to 60 seconds).
3. Stop, review/edit the transcript, then tap **Use request**.
4. Say **Open bills** for direct navigation. Other requests go to the live assistant.
5. Try **Remind Nimal Silva to check the cement delivery tomorrow at Nugegoda Residence.**
6. The assistant prepares a task. Select **Review task**, inspect the instructions/date, then **Approve & create task**.
7. In Agents > Task assistant, tap a task status to move it through To do / In progress / Done.

Assistant replies have a read-aloud control. Voice availability depends on the operating system/browser; unavailable Sinhala playback shows an explanation. English transcription has been verified with synthetic spoken audio through the full recording/transcription/review/navigation path. Sinhala is selectable, but has not been validated with a Sinhala speaker or actual device microphone.

## Android and iOS

SDK 57 was selected because Expo's current transition guidance recommends it for physical-device Expo Go testing. Android and iOS JavaScript/Hermes bundles compile successfully. Android Studio, an API 36 Pixel 5 emulator and compatible Expo Go are now installed on this laptop. See ANDROID_TESTING.md for launch and phone instructions. Standalone APK/IPA distribution is deferred.

For physical Expo Go testing later:

1. Install the matching Expo Go on the phone and put phone/laptop on the same Wi-Fi.
2. Run `npm run demo:lan` to start Expo and the API on the active Wi-Fi address.
3. Scan the printed QR code in Expo Go. In development the API host follows the Expo host. Set `EXPO_PUBLIC_API_URL` explicitly only for an intentional custom server.
4. Keep the laptop running. The API is a local demonstration service without production user authorization; use trusted demo networks and sample records.

`eas.json` contains an internal Android APK profile. A standalone build needs an Expo/EAS account and a reachable HTTPS deployment of `server/`; configure `EXPO_PUBLIC_API_URL` before building. Build with `npx eas-cli build --platform android --profile preview`. iOS uses the same code, with EAS/macOS signing and Apple provisioning when distribution is needed.

## Current workflows

- Live Gemini questions and document interpretation, with source context.
- Voice transcription and review before sending; exact navigation commands.
- Suggested task/message actions become approval cards; no payment/delete/automatic approval action exists.
- Deterministic arithmetic, duplicate supplier/invoice checks and single-line delivery quantity checks.
- Edited approval drafts, rejection history, unsent preview outbox.
- Tasks, assignments, due dates and status updates.
- File uploads, text search, original file sharing/downloads and saved daily reports.
- Local activity history and persisted records.

Records use AsyncStorage on native devices and its browser storage implementation in the laptop preview. Original files use the app's document directory on native and IndexedDB on web. Records do not sync across devices or back to the previous hosted website. The native app starts with the same sample dataset; no live website records were migrated automatically.

External email/WhatsApp, payments, Google Drive, background reminders and production team accounts are not connected. Approvals create local tasks or save unsent drafts. Site progress is sample data. Reset restores record metadata; uploaded originals are retained in app-private storage until app/browser storage is cleared.

## Development and validation

```sh
npm run typecheck
npm test
npx expo export --platform all --output-dir dist
```

- `App.tsx`: shared native screens, sheets, navigation and workflows.
- `src/VoiceSheet.tsx`: Expo Audio recording, language selection, errors and transcript review.
- `src/api.ts`: server connection; API host follows Expo during device development.
- `src/files.ts`: platform file storage and sharing.
- `src/data.ts`, `src/domain.mjs`: sample data and deterministic checks.
- `server/handler.mjs`, `server/index.mjs`: server-only Gemini calls and validated action proposals.
- `tests/`: bill checks, one-time approval decisions, audio handling and allowed voice navigation/actions.

The previous hosted web prototype remains separately in `../winklabz-office`.

Framework references: [Expo project setup](https://docs.expo.dev/get-started/create-a-project/), [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/), [EAS internal distribution](https://docs.expo.dev/build/internal-distribution/).

## Motion and interface

`src/styles.ts` holds the theme and phone layouts. `src/motion.tsx` provides short 210ms screen/sheet fades, a small translate transition, spring press feedback and a recording waveform. Android/iOS use the native driver for transform/opacity animations; browser preview uses its supported driver. No layout properties are animated. System reduced-motion preferences are respected, and Profile > Preferences can additionally reduce motion. No frame-rate benchmark on actual hardware has been performed.

## Android emulator and Aura-style interface

Run `npm run demo:lan`, then `npm run emulator` in a second terminal. The latter opens the installed Pixel 5 as a compact native phone window. ANDROID_TESTING.md contains the complete physical-phone guide. The launcher detects Wi-Fi rather than hard-coding an address and checks the Expo Go SDK before opening the project.

Home has an Ask your office card, shortcuts, actual task deadlines and approval priorities. Activity now groups new full timestamps by Sri Lanka calendar day. Existing entries without full timestamps stay under Earlier activity, preserving their original times. Pending approval events link to their actual review cards. Native Android uses dark status icons, safe areas and keyboard avoidance.
