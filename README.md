# HPK Calls V1.11.1 — Incoming Ringing Build

## What is new
- Receiver ringtone generated locally in the browser (no paid ringtone service and no external audio file).
- Repeating vibration pattern where the phone/browser supports vibration.
- Clear **Answer** and **Decline** controls on the incoming-call screen.
- Caller sees **Ringing…** after the receiver opens the HPK call link/room.
- 45-second no-answer timeout; caller receives **No answer** status.
- Caller cancellation is detected while the receiver is ringing and closes the incoming-call screen.
- Android/browser autoplay recovery: if the browser blocks automatic sound, **Enable ring sound** appears for one tap.
- Service-worker/cache version advanced to V1.11.1 so old V1.11.0 code is removed on activation.

## Complete package
Upload these files together to the same application root:
1. `package.json`
2. `server.js`
3. `index.html`
4. `sw.js`
5. `manifest.webmanifest`
6. `hpk-logo.png`
7. `icon-192.png`
8. `icon-512.png`

`README.md` and `TEST-REPORT.md` are documentation and may also be uploaded.

## Run
```bash
npm start
```
The Node server serves both the PWA and `/api` Quick Connect signaling. Deploy behind HTTPS for microphone/camera/PWA operation.

## Cost
V1.11.1 does not require a new paid service. The ringtone is generated on-device. Existing hosting/data usage still applies. TURN remains optional unless you configure a TURN service for higher network reliability.

## PWA limitation
The ringtone works while HPK Calls is open/active or when the receiver opens the shared call link. A web/PWA app cannot guarantee a custom ringtone when Android has completely stopped the app. Reliable ringing while fully closed/locked requires a later native Android + push-notification implementation.
