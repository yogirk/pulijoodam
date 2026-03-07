---
phase: 04
slug: multiplayer-pwa
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | vite.config.ts (test section) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~80 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run` + manual PWA/responsive checks
- **Before `/gsd:verify-work`:** Full suite must be green + Lighthouse PWA audit + bundle size check
- **Max feedback latency:** 80 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | MP-01, MP-02, MP-03 | unit | `npx vitest run src/multiplayer/webrtc.test.ts -x` | Wave 0 | ⬜ pending |
| 04-01-02 | 01 | 1 | MP-04, MP-06 | component | `npx vitest run src/multiplayer/HostScreen.test.tsx -x` | Wave 0 | ⬜ pending |
| 04-01-03 | 01 | 1 | MP-05, MP-07, MP-08 | unit | `npx vitest run src/multiplayer/useP2PGame.test.ts -x` | Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 1 | PROD-02 | component | `npx vitest run src/components/Board/DraggablePiece.test.tsx -x` | Wave 0 | ⬜ pending |
| 04-02-02 | 02 | 1 | PROD-01, PROD-08 | manual-only | Lighthouse PWA audit | N/A | ⬜ pending |
| 04-02-03 | 02 | 1 | PROD-03, PROD-04, PROD-05 | component | `npx vitest run src/components/ScreenReaderAnnouncer.test.tsx -x` | Wave 0 | ⬜ pending |
| 04-03-01 | 03 | 2 | PROD-06 | unit | `npx vitest run src/components/Board/Board.test.tsx -x` | Existing (extend) | ⬜ pending |
| 04-03-02 | 03 | 2 | PROD-07 | manual-only | Browser DevTools responsive mode audit | N/A | ⬜ pending |
| 04-03-03 | 03 | 2 | PROD-09 | integration | Push to branch; verify Actions run | N/A | ⬜ pending |
| 04-03-04 | 03 | 2 | PROD-10 | unit | `npm run build && check dist size` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/multiplayer/webrtc.test.ts` — RTCPeerConnection mock + SDP encode/decode stubs
- [ ] `src/multiplayer/protocol.test.ts` — Message encode/decode for move relay
- [ ] `src/multiplayer/useP2PGame.test.ts` — P2P hook with mocked connection
- [ ] `src/components/Board/DraggablePiece.test.tsx` — Pointer event drag interaction
- [ ] `src/components/ScreenReaderAnnouncer.test.tsx` — ARIA live region content

*Note: WebRTC tests require mocking RTCPeerConnection (not available in Node/happy-dom). Use a minimal mock that simulates the API surface.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Offline support | PROD-01 | Service worker behavior requires real browser | Disconnect network, verify app loads and plays AI game |
| Color-blind safe pieces | PROD-04 | Visual design requires human inspection | Use colorblind simulator extension to verify piece distinction |
| Responsive design | PROD-07 | Layout audit requires human judgment | Test in DevTools responsive mode: 320px, 768px, 1024px, 1440px |
| PWA manifest/installability | PROD-08 | Install prompt requires real browser | Run Lighthouse PWA audit in Chrome DevTools |
| CI/CD pipeline | PROD-09 | Requires GitHub Actions runner | Push to branch, verify Actions workflow runs and deploys |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 80s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
