# Site Office on Android

## Already prepared on this laptop

- Android Studio is installed under `C:\Program Files\Android\Android Studio`.
- Android SDK: `C:\Users\abdul\AppData\Local\Android\Sdk`.
- Windows Hypervisor Platform is installed and usable; no restart was required.
- AVD: `WinkLabz_Pixel5_API36`, Pixel 5, Android 16/API 36 Google APIs x86_64, 4096 MB RAM, four CPU cores, automatic graphics, 2 GB data partition.
- Expo SDK 57 is retained. Gemini's key remains only in the ignored server `.env`.

## Start both demos

In a terminal in this project:

```sh
npm run demo:lan
```

This starts the AI server on port 4184 and Expo on port 8081. It detects the current Wi-Fi/default-route address, displays the Expo Go QR code, and saves a QR image under `.expo/android-qr.png`. Keep this terminal running. The laptop browser preview remains at http://localhost:8081.

Use a second terminal for the laptop's native Android window:

```sh
npm run emulator
```

The launcher checks acceleration and the virtual device, opens a small visible Pixel 5 window, waits for Android, installs the official SDK 57 Expo Go client if missing, and opens the app. The launcher reaches Metro through `10.0.2.2`. Expo publishes the current LAN address in its manifest, and the app derives the AI server address from that manifest, so both devices use the same running server.

If a port is already occupied, stop the previous demo terminal with Ctrl+C first. The launcher does not terminate unknown processes or replace their ports.

## Your physical Android phone

1. Install Expo Go from Google Play. The app must support **SDK 57**. If the store has moved to a newer incompatible release, get the matching official Android client from https://expo.dev/go and select SDK 57.
2. Join the **same Wi-Fi network** as the laptop. Avoid a guest network that isolates devices.
3. Start `npm run demo:lan`, then scan its QR code using Expo Go's **Scan QR code** action.
4. If scanning is unavailable, enter the printed `exp://<wifi-address>:8081` development URL manually in Expo Go.
5. Allow microphone access when requested. Record **Open bills**, stop, review the transcript, then tap **Use request**.
6. Try **Remind Nimal Silva to check the cement delivery tomorrow at Nugegoda Residence.** Review the proposed task and explicitly approve it.

The unconfigured device demo has separate sample records on each device. After cloud activation and company sign-in, authorized company records sync across devices. Offline capture stays queued locally until connectivity returns. See CLOUD_SETUP.md for invitations, MFA, server setup and shared-company acceptance.

## Connection checks

Open the printed `http://<wifi-address>:4184/api/status` address in the phone's browser. It should return `connected: true` and the Gemini model name. This response contains no key.

- **Status page will not load:** confirm the same Wi-Fi, disable a phone VPN temporarily if it blocks local addresses, and check whether the router isolates clients. In Windows Security > Firewall > Allow an app through firewall, allow Node.js on the trusted **Private** network. Do not disable the firewall.
- **Expo loads but assistant does not:** port 8081 is reachable, but the separate API on 4184 may not be. Check the status URL and restart the demo after Wi-Fi changes. Remove a stale `EXPO_PUBLIC_API_URL` override if one was previously configured for a different network.
- **Project incompatible with Expo Go:** use the SDK 57 Android client. Do not upgrade the project's Expo version merely to bypass this warning.
- **Wi-Fi address changes:** restart `npm run demo:lan` and rescan the newly generated QR code.
- **Expo tunnel:** tunnelling Metro alone does not expose the separate AI server. Both services need an intentional reachable configuration; same-Wi-Fi testing is the supported default.
- **Emulator acceleration unavailable:** turn on Windows Hypervisor Platform in Windows Features, restart Windows, and run `npm run emulator` again. Firmware virtualization must also be enabled. This laptop has already passed the acceleration check.
- **Microphone permission denied:** Android Settings > Apps > Expo Go > Permissions > Microphone. Retry recording after allowing it. Laptop browser microphone testing requires localhost or HTTPS, not a plain HTTP Wi-Fi address.

## Repeatable virtual device setup

For another Windows machine, first ensure at least 32 GB free disk space. Install Android Studio, then use SDK Manager to install Android SDK Platform Tools, Android Emulator, SDK command-line tools and the Android 16/API 36 Google APIs x86_64 image. Create a Pixel 5 device with the exact name and settings above. Set `ANDROID_HOME` to that machine's SDK directory. The launcher resolves this variable before using the standard per-user SDK location.

No standalone APK, app-store upload or iOS simulator is required for this demonstration. The shared iOS bundle is still built as a compatibility check.

## Installed development and preview builds

Expo Go is the immediate laptop/demo target. To test remote push, custom account links and production configuration, link the client EAS project and install its Android development APK as described in CLOUD_SETUP.md. Then run `npm run demo:dev` and `npm run emulator -- --dev-client`. The preview APK uses the deployed HTTPS API and does not require a running Metro server. Physical Android, signed APK and iOS runtime acceptance must be reported separately from this emulator demo.
