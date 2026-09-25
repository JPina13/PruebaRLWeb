# Self-Correction Log — Retorno Logistico Web

> Append when an unexpected error, misconception, or multi-retry workflow occurs.
> Format: Date · Context · Mistake · Fix · Lesson.

> Entradas de n8n/Coolify (2026-07-26 a 2026-07-31) migradas a
> `ProvexAI/Retorno-dashboard/context/tasks/self-correction.md`.

## 2026-08-08 · A CSS token holding `100%` measures whatever element reads it
- **Context:** Bleeding the KPI panel past the container edge with
  `margin-right: calc((100vw - var(--container)) / -2)`.
- **Mistake:** 420px of real horizontal scroll. `--container` is
  `min(1320px, 100% - 2.5rem)`; that `100%` resolves against the *reading*
  element, so inside a 545px grid item it evaluated to ~505px and the calc
  produced -468px instead of -61px.
- **Fix:** Split the token — `--container-max`/`--container-pad` are absolute,
  `--container` composes them for layout, and a separate `--bleed` does the
  math in `100vw` only. Plus `overflow-x: clip` on the bleeding section.
- **Lesson:** A custom property containing a percentage is not a constant. Any
  token used in arithmetic outside its home element must be viewport- or
  px-absolute.

## 2026-08-08 · `position: fixed` escapes `body { overflow-x: clip }`
- **Context:** A full-page film-grain overlay set to `inset: -50%` to avoid seams.
- **Mistake:** The page scrolled sideways 420px. `clip` on body does not clip
  fixed descendants, because body is not their containing block.
- **Fix:** `inset: 0`. A tiling background has no seam to oversize for.
- **Lesson:** Overflow guards on body do nothing for fixed-position children.
  Never give a fixed overlay negative insets.

## 2026-08-08 · GSAP autoAlpha makes an element unfocusable on frame one
- **Context:** Fading in the fullscreen overlay menu, then focusing its first link.
- **Mistake:** Focus stayed on `<body>` behind the overlay. `autoAlpha: 0` sets
  `visibility: hidden`, and a hidden element cannot receive focus — the
  `focus()` call ran while the tween was still at its start value.
- **Fix:** Animate plain `opacity` on anything you focus into; the `hidden`
  attribute already handles removal from the tree.
- **Lesson:** `autoAlpha` is for decoration. Never on a focus target.

## 2026-08-08 · GSAP transformOrigin on SVG is bbox-relative, not user-space
- **Context:** Flipping a truck group with `scaleX: -1` at the turnaround.
- **Mistake:** `transformOrigin: '0px 0px'` pivoted on the bounding-box left
  edge (x=-46), not the group's own origin, parking the truck 92 units off.
  `'50% 50%'` was also wrong because the geometry was asymmetric.
- **Fix (first attempt):** Centred the truck geometry on x=0, so `'50% 50%'`
  was exact. **This regressed the moment the artwork changed** — adding a speed
  streak behind the truck moved the bbox to -95..55, the pivot drifted to -20,
  and the turnaround landed 40 units short of the node again.
- **Fix (real):** Derive the origin from the box at runtime —
  `transformOrigin: (-el.getBBox().x) + 'px 50%'` puts the pivot on local x=0
  whatever the artwork does. (`svgOrigin` is absolute user space, so it is
  useless for an element that translates.)
- **Lesson:** Never rely on artwork symmetry for an SVG pivot — decoration
  added later silently breaks it. Compute the origin from `getBBox()`.

## 2026-07-31 · body{overflow-x:hidden} silently kills every ScrollTrigger
- **Context:** Adding GSAP ScrollTrigger parallax to image bands and section backgrounds.
- **Mistake:** Every scrub sat at `progress: 0` forever. Triggers existed, start/end were
  correct, `scroller === window`, and `window.scrollY` tracked fine — but `trigger.scroll()`
  always returned 0. Root cause: `body { overflow-x: hidden }` computes to
  `overflow: hidden auto`, which makes <body> a scroll container, so ScrollTrigger read
  `body.scrollTop` (permanently 0) instead of the viewport.
- **Fix:** `overflow-x: clip` on body — guards horizontal overflow without creating a
  scroll container. Verified `stScroll` then tracks `scrollY` 1:1 and progress runs 0->1.
- **Lesson:** Diagnose a dead ScrollTrigger by comparing `trigger.scroll()` against
  `window.scrollY`. If they diverge, an ancestor became a scroller — check computed
  `overflow` on body/html first. Prefer `clip` over `hidden` for overflow guards.

## 2026-07-31 · GSAP measurements freeze when the preview pane is hidden
- **Context:** Verifying the parallax by scripting `window.scrollTo()` and reading transforms.
- **Mistake:** Reported the parallax as broken (frozen transforms, `progress: 0`) after the
  fix had already landed and been measured working. Nearly chased a phantom regression.
- **Fix:** GSAP's ticker runs on `requestAnimationFrame`, which the browser suspends when the
  pane is not compositing frames (the same condition that makes screenshots time out). Call
  `ScrollTrigger.update()` explicitly after each programmatic scroll when probing.
- **Lesson:** A frozen GSAP value in a headless/hidden pane is a measurement artifact, not a
  bug. Confirm by calling `ScrollTrigger.update()` — if the value corrects instantly, the
  animation is fine. Check whether screenshots also fail; that is the tell.

## 2026-07-31 · Hero crossfade held a frozen last frame
- **Context:** Hero rotated between two 8s clips, swapping on the `ended` event.
- **Mistake:** By the time `ended` fires the outgoing video has stopped, so the whole 1.1s
  crossfade dissolved *from a still image*. Read as a stutter, and with only 2 clips the same
  footage returned every 16s.
- **Fix:** Drive the swap from `timeupdate` when `duration - currentTime <= fadeLead`, so the
  dissolve begins before the clip runs out and both layers are still moving. Added 2 more clips
  plus a reshuffled play order that never repeats a clip back-to-back.
- **Lesson:** For crossfading media, trigger the transition on remaining-time, never on `ended` —
  `ended` is already too late. (If playbackRate is ever != 1, convert the wall-clock fade to media
  seconds: `lead = fadeSeconds * playbackRate`.)

## 2026-07-31 · AI video clips need re-encoding and subject-distance prompts
- **Context:** Generating hero clips via Higgsfield `kling3_0_turbo`.
- **Mistake:** (a) Shipped-as-is, one 8s 720p clip was 16.2MB (16 Mb/s) — 4x the other clips.
  (b) A "truck driving away from camera" prompt produced a clip whose subject shrank to nothing
  by t=6s, leaving 2s of empty road.
- **Fix:** (a) Re-encode every generated clip: `-an -c:v libx264 -crf 24 -preset slow -movflags
  +faststart` → 2.6MB, visually identical at 1:1 pixels. (b) Re-prompt with an explicit framing
  constraint: "camera holds a constant close distance so the trailer fills much of the frame for
  the entire shot and never shrinks into the distance."
- **Lesson:** Never commit a generative-video file at its delivered bitrate, and always constrain
  subject distance in the prompt — a loopable background clip needs its subject present for all 8s.
  No ffmpeg on this box; `npm i ffmpeg-static` into the scratchpad gives a binary without a system install.

## 2026-04-16 · Services grid column-wrap bug
- **Context:** Implementing `<ol class="services">` with `<li>` containing `<span class="services__num">`, `<h3>`, and `<p>`.
- **Mistake:** Defined `grid-template-columns: 64px 1fr` on the `<li>` without assigning grid-column to children. Auto-placement put `<p>` back in column 1 (64px wide) → text wrapped at ~8 chars.
- **Fix:** Explicit placement — `.services__num` spans rows 1–2 in col 1; `.services h3` and `.services p` both pinned to `grid-column: 2`.
- **Lesson:** When a grid row has more children than columns, always pin children explicitly or switch to a flex/subgrid layout. Auto-flow is rarely what you want for editorial lists.

## 2026-08-08 · An SVG gradient does not render on a zero-height shape
- **Context:** The two green legs of the `#circuito` signature animation used
  `stroke="url(#leg-green)"`, a `linearGradient` left at its default
  `gradientUnits="objectBoundingBox"`.
- **Mistake:** Both legs painted NOTHING for the entire build. They are
  perfectly horizontal paths, so `getBBox().height === 0`, and the SVG spec
  says an element referencing a bbox-units gradient with a zero-extent box is
  not rendered. The dashed leg and the vertical closers used solid colours and
  painted fine, which made the section look half-finished rather than broken.
- **Fix:** `gradientUnits="userSpaceOnUse"` with explicit `x1`/`x2` in viewBox
  coordinates.
- **Lesson:** Any gradient on a horizontal or vertical line, rule, or divider
  must use `userSpaceOnUse`. Also: every measurement I had said this animation
  worked — `strokeDashoffset` animated perfectly on an invisible stroke. DOM
  measurement cannot prove a thing is visible. Get a screenshot.

## 2026-08-08 · GSAP smoothOrigin silently moves a rotated SVG element
- **Context:** Vertical circuit — truck set to `rotation: 90` and placed on the
  rail with an explicit `x`/`y` plus a bbox-derived `transformOrigin`.
- **Mistake:** The truck rode 144 units left of the rail on the descent while
  the -90 return leg landed perfectly. GSAP's `smoothOrigin` keeps an already
  rotated SVG element visually still when its transformOrigin changes, so it
  adjusted the very x/y being set in the same call. The asymmetry between +90
  and -90 was the tell.
- **Fix:** `smoothOrigin: false` on that `gsap.set`.
- **Lesson:** When setting transformOrigin AND position on an SVG element that
  carries a rotation, disable smoothOrigin — otherwise the coordinates asked
  for are not the coordinates applied. Verify placement geometrically (screen
  rect vs the rail), never by reading the transform matrix: GSAP folds the
  origin compensation into it, so `matrix(...)` e/f are not the x/y you set.

- Screenshots below the fold en esta landing salen en blanco (crema) por el
  compositor Lenis/GSAP. Workaround que SI funciona: `position:fixed;inset:0;
  z-index:99999` sobre la seccion a revisar con scrollY en 0, y opacity/transform
  forzados en sus `[data-reveal]`. Recargar despues. Grepear memory.md ANTES de
  pelearse con el screenshot.

- Vectorizar arte de marca: NUNCA redibujar a ojo desde una imagen del chat.
  Pedir el archivo, trazarlo (docs/references/brand/) y verificar con IoU. Y
  antes de concluir que algo 'no coincide', aislar la pieza: confundi el brazo
  del lockup horizontal (fusionado con la R) con la geometria del simbolo y
  reporte una diferencia que no existia.
- Paths trazados con huecos necesitan `fill-rule="evenodd"`. El pixel-diff en
  Python no lo detecta (dibuja los huecos aparte); solo se ve renderizando el
  SVG de verdad. Verificacion numerica y visual no son intercambiables.
