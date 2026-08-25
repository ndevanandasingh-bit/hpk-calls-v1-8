# HPK Calls V1.11.2 — Loud Ringtone Reliability Build

HPK Calls V1.11.2 is a focused update to the working V1.11.1 call flow. It increases incoming-call audibility while preserving the existing Quick Connect, Answer/Decline and WebRTC connection logic.

## What changed in V1.11.2

- Louder Web Audio ringtone with controlled peak gain.
- Two-tone ringtone tuned for better audibility on small mobile speakers.
- Dynamics compression reduces harsh clipping while allowing a stronger ring.
- Stronger vibration pattern on supported Android browsers/devices.
- Incoming status displays **Ringing loudly…**.
- Answer, Decline, 45-second no-answer timeout and caller-cancel handling retained.
- Service-worker/cache version advanced to V1.11.2 so the new ringtone code replaces V1.11.1.

## Important Android/PWA note

The PWA ringtone follows the phone's **media volume**. HPK Calls cannot force the handset above the user's Android volume setting. If the ring is still faint, increase the phone's media volume.

A browser may also block automatic audio until the user has interacted with the site. V1.11.2 retains the **Enable ring sound** recovery button for that case.

## Deployment

Upload the complete package to the same GitHub repository/root used by the current Render service. The application files are:

- `package.json`
- `server.js`
- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `hpk-logo.png`
- `icon-192.png`
- `icon-512.png`

The PNG assets are unchanged from V1.11.1, so they do not need to be re-uploaded if they already exist and are identical.

After Render deploys, open HPK Calls. If the update banner appears, tap **Update Now** and allow the PWA to reload.

## Cost

V1.11.2 adds no paid service requirement. The ringtone is generated on the receiving device. Existing internet/hosting usage still applies. TURN remains optional unless configured for higher network reliability.
