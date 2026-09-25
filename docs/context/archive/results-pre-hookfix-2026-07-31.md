# Results

> Build log. 1-4 lines per finished item. List format. Older detail lives in `archive/`. Cap ~6k tokens.

- [2026-04-16] Initial landing shipped (`81225c7`): semantic sections (Nav, Hero, Nosotros, Valores, Unidades, Servicios, Industrias, Propuesta, Clientes, Contacto, Footer), design tokens + responsive CSS, mouse-parallax hero, reveal-on-scroll, KPI counters. Verified desktop/tablet/mobile.
- [2026-07-31] Context split (`57106f9`): platform/infra workstream (n8n, Coolify, Postgres) moved to `ProvexAI/Retorno-dashboard`. This repo is the static landing only.
- [2026-07-31] Hero video rhythm reworked (`38f5927`): swap fires from `timeupdate` before a clip ends instead of on `ended` (which dissolved from a frozen last frame); added `hero-video-3/4.mp4`; next clip drawn from least-recently-shown so repeats space to ~26s (was 16s); fade 1.6s.
- [2026-07-31] Hero payload cut: audio stripped from all 4 clips, clips 3-4 re-encoded (clip 3 16.2MB -> 2.6MB, visually identical at 1:1). Initial load 10.5MB -> 3.8MB despite doubling the clip count.
- [2026-07-31] subagent subagent: haz commit
- [2026-07-31] Immersive imagery layer: 5 Higgsfield stills (2 full-bleed bands, 2 section
  backgrounds, 1 network panel in the Servicios sticky column) + GSAP ScrollTrigger parallax.
  Fixed `body{overflow-x:hidden}` -> `clip`, which was silently freezing every scrub at
  progress 0. Verified: parallax linear 0->1 on all 4 layers, worst-case edge margin 16px,
  text contrast 17-19:1 over the backgrounds (WCAG AAA is 7:1), no console errors.
  Payload +664KB total (548KB webp + 116KB GSAP) after a 60MB->548KB PNG->webp conversion.
- [2026-07-31] Replaced the abstract topographic divider band with a cross-dock interior photo
  (`crossdock.webp`): it sat less than a screen from the Servicios network panel, so two
  abstract graphics competed, and it was the only dark slab between two cream sections.
  Removed the now-dead `band--thin` / `band--graphic` CSS and the graphic scale tween.
  Verified the new band matches the others: progress 0->0.5->1, translateY -72->72, margin 31px.
- [2026-07-31] subagent subagent: haz commit
- [2026-07-31] subagent subagent: haz commit
- [2026-07-31] subagent subagent: haz commit
