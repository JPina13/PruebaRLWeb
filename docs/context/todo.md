# Todo — Retorno Logistico Landing

## Done (v1)
- [done] Context scaffolding: `docs/context/` (`memory.md`, `todo.md`, `lessons.md`, `results.md`, `sesion-log.md`).
- [done] Copy hero video into `assets/hero-video.mp4`.
- [done] `index.html` — semantic sections (Nav, Hero, Nosotros, Valores, Unidades, Servicios, Industrias, Propuesta, Clientes, Contacto, Footer).
- [done] `styles/main.css` — design tokens, typography, grid, components, responsive breakpoints, `prefers-reduced-motion` guards.
- [done] `scripts/main.js` — mouse-parallax hero (SVG spotlight + lines + video drift), tilt cards, reveal-on-scroll, KPI counters, nav scroll state, video pause offscreen.
- [done] `.claude/launch.json` — local preview server config (http-server @ 5173).
- [done] Verified desktop / tablet / mobile via preview panel.

## Done (v1.1 — hero rhythm, 2026-07-31)
- [done] Added 2 Higgsfield clips (`hero-video-3/4.mp4`) matching the existing highway essence.
- [done] Hero sequence reworked: shuffled non-repeating order, crossfade starts before clip end
  (kills the frozen-last-frame hitch), repeat interval 16s -> ~26s. Playback stays 1x.
- [done] Video payload: audio stripped from all clips, 3/4 re-encoded (clip 3 16.2MB -> 2.6MB);
  lazy `preload="none"` + warm-next means only 3.8MB loads upfront (was 10.5MB).

## Pending (v3 — optional future work)
- [pending] Visual sign-off on the elevate pass: screenshots were blocked all session (Browser pane not displayed, so no frames composite). Everything was verified by DOM/computed-style/network measurement instead.
- [pending] Wire a real backend for the contact form. It now composes a `mailto:` in JS, which works, but still hands off to the user's mail client.
- [pending] Remaining checklist gaps for a future pass: page transitions (single-page today), hover previews in the overlay menu, cursor state beyond the hero.
- [pending] Replace textual client "logos" with real SVG marks when assets are delivered.
- [pending] Add Spanish/English toggle.
- [pending] Add lightbox / case-study deep pages.
- [pending] Add automated Lighthouse CI + bundle budget.

---

# [MIGRADO] Workstream 2 — ver ProvexAI/Retorno-dashboard/context/tasks/todo.md
