/* Motion layer — Lenis + GSAP + ScrollTrigger.
 *
 * Kept separate from main.js on purpose: everything here is enhancement. If
 * the vendored GSAP fails to load, the page still renders complete — every
 * image, every headline, the whole circuit diagram in its resolved state.
 * Nothing is gated behind an animation: initial states are set from JS, never
 * from CSS.
 *
 * Reduced motion is handled by gsap.matchMedia(), which never creates these
 * tweens under `prefers-reduced-motion: reduce` and reverts anything it set.
 */
(() => {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(max-width: 900px), (prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Motion system: one signature curve, two supports, one scale.
  const EASE = 'expo.out';        // signature
  const EASE_SOFT = 'power3.out'; // support
  const DUR = { sm: 0.24, md: 0.42, lg: 0.72, xl: 1.1 };
  const STAGGER = 0.06;
  gsap.defaults({ ease: EASE, duration: DUR.lg });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Lenis
  // Driven from the GSAP ticker so both update in the same frame, otherwise
  // trigger positions jitter by a frame or two.
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links must go through Lenis, or the visual position desyncs from
  // the tracked scroll position.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -24 });
    else target.scrollIntoView();
  });

  // ---------- Overlay menu choreography
  // The close is its own beat, not the open played backwards.
  const menuEl = document.getElementById('overlay-menu');
  if (menuEl) {
    const labels = menuEl.querySelectorAll('.menu__label');
    const indices = menuEl.querySelectorAll('.menu__index');
    const aside = menuEl.querySelector('.menu__aside');

    window.__retornoMenu = {
      open() {
        if (reduced) return;
        if (lenis) lenis.stop();
        gsap.killTweensOf([menuEl, labels, indices, aside]);
        // opacity, never autoAlpha: autoAlpha parks the element at
        // `visibility: hidden` for the first frame, and a hidden element
        // cannot take focus — the overlay would open with focus stranded on
        // <body> behind it.
        gsap.fromTo(menuEl, { opacity: 0 }, { opacity: 1, duration: DUR.sm, ease: 'none' });
        gsap.fromTo(labels,
          { yPercent: 105 },
          { yPercent: 0, duration: DUR.lg, ease: EASE, stagger: STAGGER, delay: 0.05 });
        gsap.fromTo(indices,
          { opacity: 0 },
          { opacity: 1, duration: DUR.md, ease: EASE_SOFT, stagger: STAGGER, delay: 0.12 });
        gsap.fromTo(aside,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: DUR.lg, ease: EASE, delay: 0.2 });
      },
      close(done) {
        if (lenis) lenis.start();
        if (reduced) { done && done(); return; }
        gsap.killTweensOf([menuEl, labels, indices, aside]);
        // Close: the whole panel lifts as one gesture rather than unpeeling.
        gsap.to(menuEl, {
          opacity: 0, duration: DUR.md, ease: EASE_SOFT,
          onComplete: () => {
            gsap.set(menuEl, { clearProps: 'opacity' });
            gsap.set([labels, indices, aside], { clearProps: 'all' });
            done && done();
          }
        });
      }
    };
  }

  // ---------- Everything scroll-linked lives inside matchMedia
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 901px)'
    },
    (ctx) => {
      const { motion, wide } = ctx.conditions;
      if (!motion) return;

      // --- Reveals. batch() groups elements entering together so the stagger
      // reads as one gesture instead of N disconnected tweens.
      const reveal = (selector, opts) => {
        const els = gsap.utils.toArray(selector);
        if (!els.length) return;
        gsap.set(els, { autoAlpha: 0, y: (opts && opts.y) || 24 });
        ScrollTrigger.batch(els, {
          interval: 0.1,
          batchMax: 8,
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, {
            autoAlpha: 1, y: 0,
            duration: DUR.lg, ease: EASE,
            stagger: { each: 0.08, grid: 'auto' },
            overwrite: true
          })
        });
      };
      reveal('[data-reveal]');
      reveal('[data-service]', { y: 16 });

      // --- Cards (misión/visión, valores): the cell rises, then its index
      // number catches up a beat later so the grid reads as a wave rather
      // than one block switching on.
      const cards = gsap.utils.toArray('[data-card]');
      if (cards.length) {
        const nums = cards.map((c) => c.querySelector('span')).filter(Boolean);
        gsap.set(cards, { autoAlpha: 0, y: 30 });
        if (nums.length) gsap.set(nums, { autoAlpha: 0, x: -8 });
        ScrollTrigger.batch(cards, {
          interval: 0.12,
          batchMax: 6,
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              autoAlpha: 1, y: 0,
              duration: DUR.xl, ease: EASE,
              stagger: { each: 0.09, grid: 'auto', from: 'start' },
              overwrite: true
            });
            const batchNums = batch.map((c) => c.querySelector('span')).filter(Boolean);
            if (batchNums.length) {
              gsap.to(batchNums, {
                autoAlpha: 1, x: 0,
                duration: DUR.lg, ease: EASE_SOFT,
                stagger: { each: 0.09, grid: 'auto', from: 'start' },
                delay: 0.16, overwrite: true
              });
            }
          }
        });
      }

      // --- Bands open like a shutter as they enter, then hand off to the
      // scrubbed parallax below. Different property, so the two triggers on
      // the same image never fight over a cached start value.
      gsap.utils.toArray('[data-band]').forEach((band) => {
        const img = band.querySelector('img');
        if (!img) return;
        gsap.fromTo(img,
          { clipPath: 'inset(44% 0% 44% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.5, ease: EASE,
            scrollTrigger: { trigger: band, start: 'top 92%', once: true }
          }
        );
      });

      // --- Parallax on bands and section backgrounds.
      // Created in document order so refresh runs top-to-bottom.
      gsap.utils.toArray('[data-band], [data-section-bg]').forEach((layer) => {
        const img = layer.querySelector('img');
        if (!img) return;
        // Section backgrounds sit behind copy, so they drift less than a
        // standalone band: enough to feel alive, not enough to fight the text.
        const shift = layer.hasAttribute('data-band') ? 12 : 7;
        gsap.fromTo(img,
          { yPercent: -shift },
          {
            yPercent: shift,
            ease: 'none',
            scrollTrigger: {
              trigger: layer,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
      });

      // --- The services panel lives in a sticky column, where a scrubbed
      // parallax reads as drift against a stationary frame. A one-shot reveal
      // is the honest motion for it.
      const net = document.querySelector('[data-net] img');
      if (net) {
        gsap.fromTo(net,
          { scale: 1.08, autoAlpha: 0 },
          {
            scale: 1, autoAlpha: 1, duration: DUR.xl, ease: EASE_SOFT,
            scrollTrigger: { trigger: '[data-net]', start: 'top 85%', once: true }
          }
        );
      }

      // --- Footer CTA: restates the hero's rise with the same curve.
      const ctaWords = gsap.utils.toArray('.footer__cta-word');
      if (ctaWords.length) {
        gsap.set(ctaWords, { yPercent: 108 });
        gsap.to(ctaWords, {
          yPercent: 0, duration: DUR.xl, ease: EASE, stagger: 0.07,
          scrollTrigger: { trigger: '.footer__cta', start: 'top 85%', once: true }
        });
      }

      // ================= SIGNATURE MOMENT — el circuito =================
      // One pinned stage, one scrubbed timeline. The page's only pin, and the
      // only place the animation budget is spent: it animates the actual
      // claim — a loaded leg out, an empty leg back, then the loop closed.
      const circuit = document.querySelector('#circuito');
      const stage = circuit && circuit.querySelector('.circuit__stage');

      const legsOf = (orient) => {
        const scope = document.querySelector('[data-orient="' + orient + '"]');
        if (!scope) return null;
        const q = (n) => scope.querySelector('[data-leg="' + n + '"]');
        return { out: q('out'), empty: q('empty'), back: q('back'), closeA: q('close-a'), closeB: q('close-b') };
      };
      const truck = document.querySelector('[data-truck]');
      const trailer = document.querySelector('[data-trailer]');
      const wheels = gsap.utils.toArray('[data-wheel]');
      const streak = document.querySelector('[data-streak]');
      // Not physically exact rolling. True circumference (r=6) would be ~24
      // revolutions per leg, which aliases badly against the spokes under
      // scrub. One turn per ~120 units of travel reads as rolling and stays
      // legible frame to frame.
      const ROLL = (920 / 120) * 360;
      const titles = gsap.utils.toArray('[data-circuit-title]');
      const steps = gsap.utils.toArray('[data-circuit-step]');
      const cost = document.querySelector('[data-circuit-cost]');
      const kpi = document.querySelector('[data-circuit-kpi]');

      // Prime a path for a stroke-draw. Length is read live so a resize that
      // rescales the viewBox never leaves a half-drawn line.
      const primeDraw = (path) => {
        if (!path) return 0;
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        return len;
      };

      const stepOff = { opacity: 1 };

      // The route in viewBox coordinates, per layout. Wide runs it left to
      // right; narrow runs the same circuit top to bottom, because a
      // 1200-unit-wide viewBox collapses to a ~95px strip on a phone.
      // Both share one truck — only the coordinates and the turn differ.
      const ROUTE = {
        h: { start: { x: 140, y: 110, rotation: 0 },
             out:   { x: 1060 },
             turn:  { y: 250 },
             back:  { x: 140 } },
        v: { start: { x: 110, y: 80, rotation: 90 },
             out:   { y: 740 },
             turn:  { x: 310, rotation: -90 },
             back:  { y: 80 } }
      };

      const buildCircuit = (orient, stConfig) => {
        const legs = legsOf(orient);
        if (!circuit || !truck || !legs || !legs.out) return;
        const R = ROUTE[orient];

        // GSAP measures transformOrigin from the element's BOUNDING BOX, not
        // the SVG user-space origin. Derive the offset so the pivot sits on
        // local (0,0) — the road contact point — whatever the artwork does.
        // Hard-coding `50% 50%` only works while the drawing is symmetric,
        // and it is not: the speed streak hangs off the back.
        const tb = truck.getBBox();
        gsap.set(truck, {
          x: R.start.x, y: R.start.y, rotation: R.start.rotation, scaleX: 1,
          transformOrigin: (-tb.x) + 'px ' + (-tb.y) + 'px',
          // Without this GSAP shifts x/y to keep an already-rotated element
          // visually still when the origin changes ("smooth origin"), which
          // silently moved the truck 144 units off the rail on the vertical
          // descent. We want the coordinates we asked for, not stability.
          smoothOrigin: false
        });
        gsap.set(trailer, { scaleX: 1, transformOrigin: '0% 50%' });
        gsap.set(wheels, { transformOrigin: '50% 50%' });
        gsap.set(streak, { autoAlpha: 0 });
        gsap.set(titles[1], { autoAlpha: 0, y: 24 });
        gsap.set(cost, { autoAlpha: 0 });
        gsap.set(kpi, { autoAlpha: 0, y: 16 });
        gsap.set(steps, stepOff);
        Object.values(legs).forEach(primeDraw);

        const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: stConfig });

        tl
          // 01 — out, loaded
          .to(steps[0], { opacity: 1, duration: 0.3 }, 0)
          .to(legs.out, { strokeDashoffset: 0, duration: 3 }, 0)
          .to(truck, Object.assign({ duration: 3 }, R.out), 0)
          .to(wheels, { rotation: ROLL, duration: 3 }, 0)
          .to(streak, { autoAlpha: 0.5, duration: 0.4, ease: EASE_SOFT }, 0.15)
          .to(streak, { autoAlpha: 0, duration: 0.35, ease: EASE_SOFT }, 2.65)
          // unload
          .to(trailer, { scaleX: 0, duration: 0.6 }, 3)
          .to(steps[0], { opacity: 1, duration: 0.3 }, 3.2)
          .to(steps[1], { opacity: 1, duration: 0.3 }, 3.2)
          // across to the return rail
          .to(legs.closeA, { strokeDashoffset: 0, duration: 0.8 }, 3.6)
          .to(truck, Object.assign({ duration: 0.8 }, R.turn), 3.6);

        // The turn itself: wide mirrors the truck, narrow rotates it through
        // the corner (the rotation rides along in R.turn above).
        if (orient === 'h') tl.to(truck, { scaleX: -1, duration: 0.2 }, 4.2);

        tl
          // 02 — back, empty
          .to(legs.empty, { strokeDashoffset: 0, duration: 2.6 }, 4.4)
          .to(truck, Object.assign({ duration: 2.6 }, R.back), 4.4)
          // Same local direction either way: the mirror (or the rotation)
          // makes it read correctly.
          .to(wheels, { rotation: '+=' + ROLL, duration: 2.6 }, 4.4)
          .to(streak, { autoAlpha: 0.5, duration: 0.4, ease: EASE_SOFT }, 4.55)
          .to(streak, { autoAlpha: 0, duration: 0.35, ease: EASE_SOFT }, 6.7)
          .to(cost, { autoAlpha: 1, duration: 0.6, ease: EASE_SOFT }, 4.6)
          // the turn in the argument
          .to(titles[0], { autoAlpha: 0, y: -24, duration: 0.8, ease: EASE_SOFT }, 7)
          .fromTo(titles[1], { autoAlpha: 0, y: 24 },
                             { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE_SOFT }, 7.2)
          .to(cost, { autoAlpha: 0, duration: 0.5 }, 7)
          // 03 — the same leg, paid
          .to(legs.back, { strokeDashoffset: 0, duration: 1.4 }, 7.8)
          .to(trailer, { scaleX: 1, duration: 0.8 }, 8.2)
          .to(steps[1], { opacity: 1, duration: 0.3 }, 8)
          .to(steps[2], { opacity: 1, duration: 0.3 }, 8)
          // close the loop
          .to(legs.closeB, { strokeDashoffset: 0, duration: 0.8 }, 9.2)
          .to(kpi, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE_SOFT }, 9.2);
      };

      if (wide && stage) {
        circuit.classList.add('is-stage');
        buildCircuit('h', {
          trigger: circuit,
          start: 'top top',
          // Runway, not duration: this is how a scrubbed sequence is paced.
          end: '+=260%',
          pin: stage,
          anticipatePin: 1,
          scrub: 0.8,
          invalidateOnRefresh: true
        });
      } else {
        // Narrow: the same story, no pin. A vertical circuit scrubs against
        // vertical scroll naturally, so the section plays as it passes rather
        // than locking the page — the right trade on touch.
        buildCircuit('v', {
          trigger: circuit,
          start: 'top 78%',
          end: 'bottom 30%',
          scrub: 0.8,
          invalidateOnRefresh: true
        });
      }

      return () => {
        if (circuit) circuit.classList.remove('is-stage');
      };
    }
  );

  // Lazy-loaded imagery changes layout after first paint, which invalidates
  // every start/end computed before it. Resize is auto-handled; this is not.
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
