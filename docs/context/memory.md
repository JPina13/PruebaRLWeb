# MEMORY — Retorno Logistico Web (Landing Page)

> Shared project memory. One-line entries, dated, actionable. Read before any plan.

## Project
- **Name:** Retorno Logistico — public landing page (retornologistico.com successor).
- **Root:** `C:\Proyectos\Retorno-landing\`
- **Business context source:** `C:\Users\alanv\OneDrive\Documentos\Business\Retorno_Logistico\` (CLAUDE.md + Context/).

## Locked Decisions (2026-04-16)
- Stack: static HTML + CSS + vanilla JS. No framework. No build step.
- Brand palette: primary green `#39aa35`, dark `#0a0f0a` / `#000`, accent `#8fd98a`, neutral `#f4f6f2`. Matches current retornologistico.com.
- Typography: Inter for UI + Space Grotesk for display (Google Fonts, swap). Monospace: JetBrains Mono for technical callouts.
  **Superseded 2026-08-08** — display face is now Archivo; all three self-hosted. See "Elevate pass" below.
- Design direction: inspired by terminal-industries.com — editorial grid, notch-cut separators, SVG masks, large type, smooth scroll, restrained motion.
- Hero: full-bleed video sequence (muted/autoplay/playsinline) with dark gradient overlay + mouse-reactive SVG layer.
- Motion: `prefers-reduced-motion` must disable video + parallax. Mouse parallax limited to hero + feature cards.
- Sections required: Hero, Nosotros, Valores (6), Unidades de negocio (4), Servicios (11), Industrias (18), Propuesta de valor + KPIs, Clientes, Contacto, Footer.
- Company metrics: 12,458+ cargas · 1,796+ clientes · 1,500+ transportistas certificados · 18+ industrias · 500+ puntos de carga.
- Mission / Vision / Values copy: source of truth is business CLAUDE.md (lines 19–21).
- Flagship clients: Unilever, Bimbo, Barcel, Mars, P&G, Jumex, Jugo del Valle, Ingredion, Peñafiel, La Costeña, International Paper, Moderna.

## Constraints
- No secrets, no analytics keys. Contact form posts to `mailto:` for now (backend TBD).
- All images/video served locally from `assets/`.
- Must render correctly offline (file://) for preview.

## Hero video sequence (2026-07-31)
- 4 clips in `assets/`: `hero-video.mp4` (roadside wide, trucks pass), `hero-video-2.mp4`
  (low chase on red tractor), `hero-video-3.mp4` (aerial, two trailers through desert
  mountains), `hero-video-4.mp4` (rear chase, constant distance).
- Clips 3–4 generated with Higgsfield `kling3_0_turbo` (text-to-video, 8s, 720p, 16:9,
  12 credits each). Prompts live in the Higgsfield generation history.
- **Shared essence — match this for any future clip:** photoreal documentary footage,
  Mexican federal highway, arid mountains + dry scrub, deep blue sky, bright midday sun,
  class-8 tractor-trailers in motion, single continuous camera move, no cuts/text/logos.
- All clips normalized to 1280x720 / 24fps / h264, audio stripped (hero is muted).
- Kling ships wildly over-bitrated files (clip 3 arrived at 16 Mb/s). Always re-encode
  before committing: `ffmpeg -i in.mp4 -an -c:v libx264 -crf 24 -preset slow -movflags +faststart out.mp4`.
- Playback rhythm (`scripts/main.js`): shuffled order, never the same clip twice in a row,
  a given clip returns only every ~26s. Crossfade starts 1.6s *before* a clip ends so both
  layers stay in motion — never swap on `ended`, that holds a frozen last frame through the fade.
- Playback speed stays 1x (a 0.9x slow-down was tried and rejected by Alan, 2026-07-31).
- Only clip 1 preloads; the next clip is warmed one beat ahead (`preload="none"` + `load()`).

## Imagery + scroll motion (2026-07-31)
- 5 stills in `assets/img/` generated with Higgsfield `recraft_v4_1` (2k, 8 credits each):
  `nosotros` / `crossdock` / `industrias` / `contacto` (photoreal) and `servicios` (graphic,
  brand palette passed via the model's `colors` param).
- Registers are deliberately mixed: photography where atmosphere helps, graphic where a
  system or data idea is being communicated. Photos get NO `colors` param — they are graded
  in CSS instead, same approach as the hero video.
- **Only ONE abstract graphic on the page, and it lives in Servicios.** A second abstract
  band (topographic route lines) originally sat between Unidades and Servicios; it landed
  less than a screen from the Servicios network panel and the two competed. Replaced with
  the cross-dock interior. Keep abstract pieces far apart, and prefer a physical subject
  when the neighbouring section already carries a graphic.
- Photo vocabulary should stay varied: aerial highway, cross-dock interior, night yard,
  truck cab at dawn. Before adding another, check which register is missing — everything
  was exterior until the cross-dock shot.
- **A band's veil must END on the exact background colour of the section that follows it**,
  at alpha 1 — otherwise the photo stops on a hard horizontal seam. `.band` defaults to an
  ink exit; add `.band--exit-cream` when the next section is light. Check with
  `band.nextElementSibling`'s computed `background-color`.
- **BOTH ends now, not just the bottom** (revised again 2026-08-08). A band declares the
  colour it enters from and the colour it exits to: `.band__veil` takes `--veil-enter` /
  `--veil-exit` as rgb triplets, and `.band--enter-cream` / `.band--exit-cream` set them.
  Before this only the exit was handled, so the aerial band met the cream section above it
  on a hard edge. Check both neighbours, not just `nextElementSibling`.
- **But the MIDDLE of the veil must stay clear** (revised 2026-08-08). The first version
  ramped from ink@0.06 at 55% to cream@0.28 at 85%, which turned the bottom half of every
  photograph milky — flagged as "too much effect". Both ends dissolve now, the middle ~50%
  carries no wash, and `brightness` went 0.80 -> 0.88. Use alpha-0 ink as the neutral
  midpoint, never the `transparent` keyword: gradients interpolate through transparent
  *black* and grey the midtones.
- Keep the bottom fade to the last ~15%: the subject of the aerial shot sits around 88% of
  the band height, so a longer ramp swallows it. Framing is tunable per band via
  `object-position` on that band's `.band__img` if a subject lands badly.
- Recraft ships ~12MB PNGs. Always convert before committing:
  `ffmpeg -i in.png -vf scale=1920:-2 -c:v libwebp -quality 80 -compression_level 6 out.webp`
  (60MB -> 548KB across all five, no visible loss).
- GSAP 3.15.0 + ScrollTrigger vendored to `assets/vendor/` (116KB). Amends the "no framework"
  decision on purpose: still static, no build step, still works from `file://`.
- Motion lives in `scripts/scroll-motion.js`, separate from `main.js` — if GSAP fails to load
  the page renders every image correctly, just without parallax. `gsap.matchMedia()` skips
  all of it under `prefers-reduced-motion`.
- **`overflow-x: hidden` on `<body>` silently breaks ScrollTrigger** — it computes to
  `overflow: hidden auto`, making body a scroll container, so ScrollTrigger reads
  `body.scrollTop` (always 0) and every scrub freezes at progress 0. Use `overflow-x: clip`.
- Parallax overhang must exceed travel: bands use `inset:-26%` + `height:152%` against
  yPercent ±12; section backgrounds `inset:-16%` against ±7. Verified worst-case margin 16px.
- Existing `[data-reveal]` IntersectionObserver reveals were left alone on purpose — they
  work, and swapping 40+ elements to ScrollTrigger.batch is churn for marginal gain.

## Elevate pass — award-craft (2026-08-08)
- Gap-analysis scored the page 3.2/10 on the Awwwards anatomy checklist; target was 6.5. Mode Preserve, stack stays static (award-craft v0.1 assumes Next.js — recipes were hand-translated, no port).
- Display face is **Archivo** (Omnibus-Type variable, wdth 62-125), chosen for its highway-signage lineage and because Space Grotesk + Inter + JetBrains is the default AI trio. Inter and JetBrains Mono kept.
- All three fonts self-hosted as latin-subset woff2 in `assets/fonts/` (169KB total). Zero third-party requests now — Google Fonts was two render-blocking origins.
- Colour tokens are OKLCH with every neutral tinted toward the brand hue; no pure `#000`/`#fff`. A `@supports not (color: oklch())` block restores the plain hexes for old corporate browsers.
- Motion system: one signature ease (`expo.out` / `--ease-sig`) plus two supports, and a fixed duration scale (`--dur-xs..xl`) mirrored in `gsap.defaults()`. Nothing ad hoc.
- **Type scale was dialled back after review.** The award rubric wants a 10-18vw hero; at 11.6vw (167px) Alan found it overwhelming. Now 8.9vw / 128px, with every display step cut 15-38% and body/mono untouched. Deliberate trade: costs ~0.3 on the self-scored checklist, buys a page that is comfortable to read. Do not push the display steps back up without asking.
- Heads that sit in a narrow side column (`.section__grid .section__head`, `.services__sticky`) step down one level — the full display size breaks them into 5 ragged lines.
- **Lenis vendored** to `assets/vendor/lenis.min.js`, driven off the GSAP ticker with `lagSmoothing(0)`. Anchor links must route through `lenis.scrollTo`, never `scrollIntoView`.
- **Signature moment = `#circuito`**, the page's ONLY pin: one pinned stage, one scrubbed timeline, loaded leg out -> empty leg back -> loop closed. It animates the actual sales claim. Desktop only (>=901px); narrow viewports get a designed static-resolved version, not a degraded desktop.
- Scroll arc reordered to PAS: hero -> social proof -> problem/circuit -> value prop -> unidades -> servicios -> industrias -> nosotros -> contacto. "Nosotros" was position 2, now 8.
- **One CTA label page-wide**: "Ver mi propuesta de retorno" (was 5 competing labels).
- Contact form composes a `mailto:` URL in JS. A `<form action="mailto:" method="post">` is silently broken in modern browsers — it was never submitting.
- Hero clips 1 and 2 re-encoded (14.0MB -> 7.3MB total; initial page payload 1.9MB, was ~4.2MB).
- Industrias grid was deleted: the marquee already listed the same 18 items.

## Deployment — Vercel (2026-08-02)
- Proyecto `alans-projects-e2dbc76b/retorno-landing`. Producción:
  **https://retorno-landing-five.vercel.app** (alias estable; cada deploy genera además
  una URL única). Sin Deployment Protection: es públicamente accesible sin credenciales.
- Deploy manual con `vercel --prod --yes`. NO hay integración Git todavía — un push a
  `main` no redespliega. Conectar el repo desde el dashboard si se quiere automático.
- `vercel.json` DEBE declarar `framework: null`, `buildCommand: null`, `outputDirectory: "."`.
  Sin eso Vercel autodetecta Next.js y el build muere con *"No Next.js version detected"*,
  aunque no exista `package.json`.
- `vercel.json` NO admite claves de comentario (`"//"`): el schema las rechaza y el deploy
  falla antes de subir. Los comentarios van fuera del archivo.
- `.vercelignore` excluye `docs/`, `.claude/`, `CLAUDE.md`, `README.md`. Sin él, Vercel sirve
  TODO el repo como estático y `docs/context/memory.md` quedaría público. Verificado: esas
  rutas devuelven 404 en producción.
- La CLI escribe el token en `AppData\Roaming\xdg.data\com.vercel.cli\auth.json`, pero la
  v50.12.3 instalada lee `AppData\Roaming\com.vercel.cli\Data\auth.json`. Se resuelve con
  `XDG_DATA_HOME="C:\Users\alanv\AppData\Roaming\xdg.data"` antes del comando — no copiar
  credenciales entre rutas.

## Repos (2026-08-02)
- Este repo vive en **`alanvaa06/Retorno-landing`** (privado). Transferido desde
  `ProvexAI/Retorno-landing` el 2026-08-02; GitHub dejó redirect, así que los clones viejos
  siguen resolviendo. La org ya NO tiene acceso.
- El personal `alanvaa06/Retorno_Logistico` sigue archivado y NO es este repo — es el linaje
  viejo, último push 2026-04-16. No empujar ahí.
- El desarrollo de la plataforma/dashboard sigue en **`ProvexAI/Retorno-dashboard`** (`C:\Proyectos\Retorno-dashboard`) — todo el contexto de n8n/Coolify/Postgres migró allá. Este repo es SOLO el landing estático.
- **Los dos repos hermanos ahora viven en cuentas distintas** (landing en personal, dashboard
  en la org). Los archivos de contexto se referencian entre sí — al citar rutas cruzadas,
  usar el owner correcto de cada uno.

---

# [MIGRADO] Workstream 2 — ver ProvexAI/Retorno-dashboard

Todo el contenido de infra (Coolify, Postgres, workflow Google_Maps_Retorno,
decisiones y pendientes) vive ahora en `ProvexAI/Retorno-dashboard/context/`.
No duplicar aqui.

---

# decision: el rombo de marca RL = rombo vertical alto + diamante suelto abajo-izq que comparte el vertice izquierdo, un solo color (no los diamantes anidados viejos). SVG viewBox 0 0 82 128; paths en index.html (nav+footer) y en el favicon. Verde de marca real #48B158 = `--green-bright`; verde bosque de titulares del deck ~#0A5838 (aun no usado como token).
# decision: PSCP = Plataforma de Servicios Carta Porte, el producto RL para automatizar el CFDI con Complemento Carta Porte. Aparece en Certificaciones, value-prop cliente y beneficios transportista.
# decision: el pane de preview NO captura screenshots de las secciones crema de esta landing (Lenis/GSAP rompen el compositor tras hacer scroll); verificar por DOM a11y + geometria, no por screenshot.
# decision: las redes sociales viven en 3 superficies (footer brand, meta de #contacto, menu overlay) con un solo componente `.social` (icon-links circulares, glifo inline, aria-label) + `sameAs` en el JSON-LD Organization. URLs limpias de utm/mibextid; Facebook queda como link `/share/1GQQq6uCK3/` porque no hay vanity URL conocida.
# decision: el logo es arte trazado del maestro oficial, no tipografia ni redibujo: sprite `<symbol id=rl-lockup>` (viewBox 0 0 460.21 128, 17 formas) y `#rl-mark` (0 0 78.72 128, 2 formas) al inicio de index.html, ambos con `fill-rule=evenodd`. Fuentes y trazador reproducibles en docs/references/brand/. Tinta oficial `--green-logo: #37B04A`, distinta de `--green-bright` #48B158 que sigue en acentos de UI. El wordmark oficial dice LOGISTICO sin acento.
