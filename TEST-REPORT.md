# HPK Calls V1.12.0 — Test Report

Build: **Advanced Reliability Edition**

## Automated/static checks — PASS

- Inline application JavaScript: syntax check passed with Node.js.
- `server.js`: syntax check passed with Node.js.
- DOM validation: 162 unique IDs; no duplicate IDs.
- JavaScript DOM references: 155 checked; 0 missing.
- Required runtime files present: `index.html`, `server.js`, `package.json`, `sw.js`, `manifest.webmanifest`, HPK logo and both icons.
- App version: `1.12.0`.
- Service-worker cache version: `hpk-calls-pwa-v1.12.0`.

## Local signaling/API regression — PASS

Tested against a local V1.12.0 server:

1. `/api/health` returned `ok: true`, version `1.12.0`, and process uptime.
2. `/api/config` returned WebRTC ICE configuration.
3. Quick Connect room creation returned a room ID and owner token.
4. Receiver ringing state succeeded.
5. Receiver answer returned a responder token.
6. Connected state succeeded.
7. Connected-session control polling succeeded.
8. Connected signaling expiry extended to the long-call window.
9. Remote hang-up succeeded.

## V1.12.0 feature checks — PASS (code/static)

- Caller ringback logic present and stops on answer, decline, missed call, cancellation and hang-up.
- Receiver ringtone preference supports Normal / Loud / Maximum.
- Vibration pattern changes with ringtone strength.
- Live Call Health strip is wired to local WebRTC statistics.
- One-tap redial is wired to the latest local recent-call entry.
- V1.11.2 ringtone, Answer/Decline, 45-second timeout, caller-cancel detection, Smart Adaptive Quality and Android audio-unlock logic retained.

## Two-device field verification still required after deployment

Browser/WebRTC behavior depends on the actual phones and networks. After Render deploys V1.12.0, verify with two phones:

- Caller hears ringback after receiver opens/rings.
- Receiver tests Normal, Loud and Maximum ringtone modes.
- Answer connects two-way audio.
- Live Call Health appears after connection.
- End Call propagates to the other phone.
- One-tap redial creates a new call.

TURN remains optional but recommended for networks where direct WebRTC cannot connect.
