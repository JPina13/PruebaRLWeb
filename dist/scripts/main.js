/* =========================================================
   Retorno Logístico — Interactions (no GSAP required)
   Everything here degrades cleanly: if scroll-motion.js or GSAP never
   loads, the page is still complete, navigable and readable.
   ========================================================= */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Year in footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Local time in Querétaro (footer + overlay menu)
  const clocks = document.querySelectorAll('[data-local-time]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false
    });
    const tick = () => {
      const t = fmt.format(new Date());
      clocks.forEach((el) => { el.textContent = t; });
    };
    tick();
    window.setInterval(tick, 30000);
  }

  // ---------- Circuit diagram: pick the layout
  // viewBox cannot be set from CSS, and the diagram has to be correct even
  // when GSAP never loads, so this lives here rather than in the motion layer.
  const circuitSvg = document.querySelector('.circuit__diagram svg');
  const circuitTruck = document.querySelector('[data-truck]');
  if (circuitSvg) {
    const narrow = window.matchMedia('(max-width: 900px)');
    const applyLayout = () => {
      circuitSvg.setAttribute('viewBox', narrow.matches ? '0 0 420 820' : '0 0 1200 340');
      // Park the truck on the matching origin node. GSAP overwrites this with
      // the identical values when it runs; without it the truck would sit at
      // viewBox 0,0 in the corner.
      if (circuitTruck) {
        circuitTruck.setAttribute('transform',
          narrow.matches ? 'translate(110 80) rotate(90)' : 'translate(140 110)');
      }
    };
    applyLayout();
    narrow.addEventListener('change', applyLayout);
  }

  // ---------- Nav: scrolled state
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Content is visible immediately; decorative media never blocks it.
  document.documentElement.classList.add('is-loaded');

  // ---------- Overlay menu
  const menu = document.getElementById('overlay-menu');
  const toggle = document.querySelector('.nav__toggle');
  if (menu && toggle) {
    const focusables = () => menu.querySelectorAll('a[href], button:not([disabled])');
    let lastFocused = null;

    const setMenu = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) {
        // Fall back to the toggle: if the menu was opened without the button
        // taking focus first, activeElement is <body> and closing would drop
        // the keyboard user back at the top of the document.
        lastFocused = document.activeElement === document.body ? toggle : document.activeElement;
        menu.hidden = false;
        window.__retornoMenu && window.__retornoMenu.open();
        const first = focusables()[0];
        if (first) first.focus({ preventScroll: true });
      } else {
        const done = () => {
          menu.hidden = true;
          if (lastFocused) lastFocused.focus({ preventScroll: true });
        };
        if (window.__retornoMenu) window.__retornoMenu.close(done);
        else done();
      }
    };

    document.documentElement.classList.add('menu-ready');
    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key !== 'Tab') return;
      // Trap focus while the overlay owns the screen.
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // A resize past the breakpoint must not leave the overlay stranded open.
    window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
      if (e.matches && !menu.hidden) setMenu(false);
    });
  }

  // ---------- Counters
  const counters = document.querySelectorAll('[data-counter]');
  const nf = new Intl.NumberFormat('es-MX');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-counter'), 10) || 0;
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = nf.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = nf.format(target);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if (prefersReduced || !('IntersectionObserver' in window)) {
      counters.forEach((el) => {
        el.textContent = nf.format(parseInt(el.getAttribute('data-counter'), 10) || 0);
      });
    } else {
      const counterIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach((el) => counterIO.observe(el));
    }
  }

  // ---------- Contact form
  // No backend yet. A `mailto:` form POST is silently broken in most modern
  // browsers, so compose the message and hand it to the mail client instead.
  const mailForm = document.querySelector('[data-mail-form]');
  if (mailForm) {
    const compose = (e) => {
      e.preventDefault();
      if (!mailForm.reportValidity()) return;
      const get = (n) => (mailForm.elements[n] && mailForm.elements[n].value.trim()) || '';
      const to = mailForm.getAttribute('data-mailto');
      const subject = `Propuesta de retorno — ${get('empresa') || get('nombre')}`;
      const body = [
        `Nombre: ${get('nombre')}`,
        `Empresa: ${get('empresa')}`,
        `Email: ${get('email')}`,
        '',
        'Lane u operación:',
        get('operacion') || '(sin detallar)'
      ].join('\n');
      window.location.href =
        `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    mailForm.addEventListener('submit', (e) => e.preventDefault());
    const composeButton = mailForm.querySelector('[data-compose]');
    composeButton.addEventListener('click', compose);
    mailForm.querySelector('fieldset').disabled = false;
  }

  // ---------- Mouse-reactive hero
  const hero = document.querySelector('.hero');
  const heroSpot = document.querySelector('.hero__spot');
  const heroVideos = Array.from(document.querySelectorAll('.hero__video-el'));
  const heroCursor = document.querySelector('.hero-cursor');

  if (hero && !prefersReduced && window.matchMedia('(hover: hover)').matches) {
    let targetX = 0.5, targetY = 0.5;
    let currentX = 0.5, currentY = 0.5;
    let pointerPX = 0, pointerPY = 0;
    let cursorX = 0, cursorY = 0;
    let ticking = false;

    const VB_W = 1600, VB_H = 900;

    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      cursorX += (pointerPX - cursorX) * 0.22;
      cursorY += (pointerPY - cursorY) * 0.22;

      const dx = currentX - 0.5;
      const dy = currentY - 0.5;

      if (heroSpot) {
        heroSpot.setAttribute('cx', (currentX * VB_W).toFixed(1));
        heroSpot.setAttribute('cy', (currentY * VB_H).toFixed(1));
      }
      if (heroCursor) {
        heroCursor.style.transform = `translate3d(${cursorX.toFixed(2)}px, ${cursorY.toFixed(2)}px, 0)`;
      }
      if (heroVideos.length) {
        const t = `translate3d(${(dx * -22).toFixed(2)}px, ${(dy * -14).toFixed(2)}px, 0) scale(1.06)`;
        heroVideos.forEach((v) => { v.style.transform = t; });
      }

      const still =
        Math.abs(targetX - currentX) < 0.001 &&
        Math.abs(targetY - currentY) < 0.001 &&
        Math.abs(pointerPX - cursorX) < 0.3 &&
        Math.abs(pointerPY - cursorY) < 0.3;
      if (still) ticking = false;
      else requestAnimationFrame(update);
    };

    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      pointerPX = e.clientX - rect.left;
      pointerPY = e.clientY - rect.top;
      targetX = pointerPX / rect.width;
      targetY = pointerPY / rect.height;
      if (heroCursor) heroCursor.classList.add('is-visible');
      kick();
    });

    hero.addEventListener('mouseleave', () => {
      targetX = 0.5; targetY = 0.5;
      if (heroCursor) heroCursor.classList.remove('is-visible');
      kick();
    });

    if (heroCursor) {
      hero.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('mouseenter', () => heroCursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => heroCursor.classList.remove('is-hover'));
      });
    }
  }

  // Load one clip at a time, only while visible. Respect reduced motion/data.
  const connection = navigator.connection;
  const videoAllowed = !prefersReduced && !(connection &&
    (connection.saveData || /(^|-)2g$/.test(connection.effectiveType)));
  let videoVisible = false;
  let videoIndex = 0;
  const syncVideo = () => {
    heroVideos.forEach((v) => v.pause());
    if (!videoAllowed || !videoVisible || document.hidden) return;
    const video = heroVideos[videoIndex];
    if (!video) return;
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(() => {});
  };
  heroVideos.forEach((video, i) => {
    video.addEventListener('ended', () => {
      video.classList.remove('is-active');
      videoIndex = (i + 1) % heroVideos.length;
      heroVideos[videoIndex].classList.add('is-active');
      syncVideo();
    });
  });
  if (hero && videoAllowed && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      videoVisible = entry.isIntersecting;
      syncVideo();
    }, {threshold: 0.1}).observe(hero);
  }
  document.addEventListener('visibilitychange', syncVideo);
})();
