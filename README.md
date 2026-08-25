# HPK Calls V1.12.0 — Advanced Reliability Edition

HPK Calls is an installable PWA for app-to-app WebRTC voice/video calling with Quick Connect signaling.

## V1.12.0 improvements

- Caller **ringback tone** while the receiver is ringing.
- Receiver ringtone strength: **Normal / Loud / Maximum**.
- Stronger vibration pattern automatically follows ring-strength mode.
- **Live Call Health** strip during connected calls: quality, WebRTC route, latency and receive bitrate.
- **One-tap redial** shortcut for the latest local recent call.
- Connected signaling sessions use a sliding lifetime (up to 120 minutes from the latest connected control activity), improving long-call End/remote-control reliability.
- Existing V1.11.2 Answer/Decline, 45-second no-answer handling, caller cancellation, loud ringtone, Android sound unlock, Smart Adaptive Quality, recent calls, favorites, diagnostics and system check remain.
- Server health now reports application version and process uptime.

## No mandatory paid service added

V1.12.0 continues to work with the existing Render + WebRTC/STUN setup. TURN support remains optional but recommended for maximum connection reliability on restrictive mobile networks.

## Required deployment files

Upload/replace these files in the GitHub repository root:

1. `package.json`
2. `server.js`
3. `index.html`
4. `sw.js`
5. `manifest.webmanifest`

The existing `hpk-logo.png`, `icon-192.png`, and `icon-512.png` are unchanged. `README.md` and `TEST-REPORT.md` are optional for runtime.

## Important PWA limitation

Custom ringing is reliable while the PWA/call page is active. Guaranteed incoming ringing while the app is fully closed requires a later native Android/push-notification implementation.
