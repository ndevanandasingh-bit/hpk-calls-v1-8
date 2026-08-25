# HPK Calls V1.11.2 Test Report

## Automated package checks

- `server.js` JavaScript syntax: PASS
- Main inline application JavaScript syntax: PASS
- `package.json` JSON validation: PASS
- `manifest.webmanifest` JSON validation: PASS
- Quick Connect server starts successfully: PASS
- `/api/health` reports V1.11.2: PASS
- `/api/config` reports V1.11.2: PASS
- Required PWA assets present: PASS
- Service-worker cache version `hpk-calls-pwa-v1.11.2`: PASS
- Service-worker registration query updated to `v=1.11.2`: PASS

## V1.11.2 ringtone checks

- Ring peak gain increased from V1.11.1 level: PASS
- Two-tone ringtone frequencies present: PASS
- Dynamics compressor present: PASS
- Stronger vibration pattern present: PASS
- 45-second no-answer workflow retained: PASS
- Answer/Decline controls retained: PASS
- Caller-cancel and remote-hangup signaling retained: PASS

## Device limitation

Actual perceived loudness depends on the receiving phone's media volume, speaker characteristics and browser autoplay policy. Final two-phone listening verification should be performed after deployment.
