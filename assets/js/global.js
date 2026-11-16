/* ==========================================================================
   Suleman Automates — global behaviour
   Intro loading screen (first visit per tab), header entrance (scattered
   letters converge), mobile menu, scroll reveals, 3D tilt.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Vendor libraries (local files, optional enhancements) ----------
     GSAP + ScrollTrigger + SplitText + Lenis ship in assets/js/vendor/ and are
     loaded before this file. Every use is guarded: if a vendor file is missing
     or fails to parse, the vanilla paths below still work. */
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var hasSplit = !!(window.gsap && window.SplitText);
  var hasLenis = !!window.Lenis;
  if (hasGsap && !reducedMotion.matches) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    if (hasSplit) window.gsap.registerPlugin(window.SplitText);
  }

  /* ---------- Smooth scrolling (Lenis) tied to the GSAP ticker ---------- */
  function initSmoothScroll() {
    if (reducedMotion.matches || !hasLenis || !hasGsap) return;

    var html = document.documentElement;
    if (html.dataset.lenisActive) return;
    html.dataset.lenisActive = '1';
    html.style.scrollBehavior = 'auto'; // Lenis owns scrolling now

    var lenis = new window.Lenis({ lerp: 0.1 });
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) {
      lenis.raf(time * 1000); // gsap.ticker runs in seconds, Lenis wants ms
    });
    window.gsap.ticker.lagSmoothing(0);

    // Anchor links scroll through Lenis, offset for the fixed header
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -90 });
    });
  }

  /* ---------- Brand intro: ~3.4s loading screen, slides away ---------- */
  function runIntro() {
    var seen;
    try { seen = sessionStorage.getItem('sa-intro-seen'); } catch (e) { seen = '1'; }
    if (seen || reducedMotion.matches || !document.documentElement.classList.contains('js')) {
      document.documentElement.classList.remove('intro-pending');
      return false;
    }

    var intro = document.createElement('div');
    intro.className = 'intro';
    intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML =
      '<div class="intro-inner">' +
        '<div class="intro-mark"><img src="assets/img/brand-monogram.png" alt=""></div>' +
        '<div class="intro-word">Suleman Automates<small>Voice AI for Real Estate</small></div>' +
      '</div>' +
      '<div class="intro-bar"><span></span></div>';
    document.body.appendChild(intro);
    document.documentElement.classList.remove('intro-pending');

    try { sessionStorage.setItem('sa-intro-seen', '1'); } catch (e) { /* private mode */ }

    // Slide the curtain away at ~3s (640ms transition), then remove from DOM
    window.setTimeout(function () {
      intro.classList.add('is-done');
      window.setTimeout(function () { intro.remove(); }, 800);
    }, 2950);
    return true;
  }

  /* ---------- Header entrance: brand letters scatter in, nav slides down ---------- */
  function scatterBrand() {
    var name = document.querySelector('.site-header .brand-name');
    if (!name || name.dataset.scattered) return null;
    var textNode = name.firstChild;
    if (!textNode || textNode.nodeType !== 3) return null;
    var text = textNode.textContent;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var s = document.createElement('span');
      s.className = 'ch';
      s.innerHTML = ch === ' ' ? '&nbsp;' : ch;
      s.style.setProperty('--tx', (Math.random() * 48 - 24).toFixed(1) + 'px');
      s.style.setProperty('--ty', (Math.random() * 38 - 19).toFixed(1) + 'px');
      s.style.setProperty('--tr', (Math.random() * 40 - 20).toFixed(1) + 'deg');
      s.style.setProperty('--cd', (i * 26) + 'ms');
      frag.appendChild(s);
    }
    name.replaceChild(frag, textNode);
    name.dataset.scattered = '1';
    name.classList.add('is-scattered');
    return name;
  }

  function headerEntrance(introPlayed) {
    var html = document.documentElement;
    if (!html.classList.contains('js')) { html.classList.remove('header-enter'); return; }

    // Stagger the nav items
    var items = document.querySelectorAll('.nav .nav-link, .nav .header-cta, .menu-btn');
    for (var i = 0; i < items.length; i++) {
      items[i].style.setProperty('--cd', (120 + i * 70) + 'ms');
    }

    if (reducedMotion.matches) {
      html.classList.remove('header-enter');
      return;
    }

    var brand = scatterBrand();
    var start = introPlayed ? 3080 : 260; // converge during the intro slide, or shortly after load
    window.setTimeout(function () {
      requestAnimationFrame(function () {
        if (brand) brand.classList.remove('is-scattered');
        html.classList.remove('header-enter');
      });
    }, start);
  }

  /* ---------- Header scroll state: deeper glass + gold edge when scrolled ---------- */
  function initHeaderState() {
    var header = document.querySelector('.site-header');
    if (!header || header.dataset.scrollStateBound) return;
    header.dataset.scrollStateBound = '1';

    var ticking = false;
    function update() {
      ticking = false;
      header.classList.toggle('is-scrolled', (window.scrollY || 0) > 12);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    });
    update();
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var btn = document.querySelector('.menu-btn');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus();
      } else {
        btn.focus();
      }
    }

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });

    // Close if the viewport grows past the mobile breakpoint
    window.matchMedia('(min-width: 860px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- Scroll reveals (generic blocks; steps/flow-nodes are scroll-driven below) ---------- */
  function initReveals() {
    var items = document.querySelectorAll('.reveal:not(.step):not(.flow-node)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Scroll-driven panels (how-it-works steps, product flow) ----------
     The page never moves on its own: as the user scrolls, each panel slides in
     from its side at its own scroll depth — one by one, tied to the scrollbar.
     Scrolling back up slides them out again. */
  function initScrollPanels() {
    var panels = document.querySelectorAll('.step, .flow-node');
    if (!panels.length) return;

    if (reducedMotion.matches) {
      panels.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    /* GSAP path: each panel gets its own ScrollTrigger with a slightly
       different start line, so they light up one by one as the scrollbar
       moves — and slide back out when you scroll up. The .in-view class is
       still toggled for the CSS light-up (gold border, glow, sheen). */
    if (hasGsap) {
      var sequentialG = window.matchMedia('(min-width: 960px)');
      panels.forEach(function (el) {
        el.style.transition = 'none'; // GSAP owns the card's motion now

        var siblings = el.parentElement.querySelectorAll('.step, .flow-node');
        var idx = Array.prototype.indexOf.call(siblings, el);
        var count = siblings.length;
        // Spread start lines across the viewport so cards appear in sequence
        var shift = sequentialG.matches && count > 1 ? (idx / (count - 1)) * 22 : 0;
        var startLine = 'top ' + (88 - shift) + '%';

        // Which side does this card slide in from? (mirrors the CSS var;
        // empty string means the default declared in CSS: -52px, from the left)
        var fromVar = window.getComputedStyle(el).getPropertyValue('--slide-from').trim();
        var fromSide = fromVar ? (parseFloat(fromVar) || 0) : -52;

        window.gsap.fromTo(el,
          { x: fromSide, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: startLine,
              toggleActions: 'play none none reverse'
            }
          }
        );

        window.ScrollTrigger.create({
          trigger: el,
          start: startLine,
          onEnter: function () { el.classList.add('in-view'); },
          onLeaveBack: function () { el.classList.remove('in-view'); }
        });
      });

      window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
      return;
    }

    /* Vanilla fallback: rAF-throttled scroll math (works without any vendor) */
    var groups = [];
    var byGrid = {};
    panels.forEach(function (el) {
      var key = el.parentElement ? (el.parentElement.className || '') : '';
      if (!(key in byGrid)) { byGrid[key] = []; groups.push(byGrid[key]); }
      byGrid[key].push(el);
    });
    var sequential = window.matchMedia('(min-width: 960px)');

    function update() {
      var vh = window.innerHeight;
      groups.forEach(function (list) {
        if (sequential.matches) {
          var rect = list[0].parentElement.getBoundingClientRect();
          var progress = (vh * 0.9 - rect.top) / (rect.height + vh * 0.28);
          progress = Math.min(Math.max(progress, 0), 1);
          var spread = list.length > 1 ? 0.72 / (list.length - 1) : 0;
          list.forEach(function (el, i) {
            el.classList.toggle('in-view', progress >= 0.14 + i * spread);
          });
        } else {
          list.forEach(function (el) {
            var r = el.getBoundingClientRect();
            el.classList.toggle('in-view', r.top < vh * 0.9);
          });
        }
      });
    }

    var raf = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; update(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sequential.addEventListener('change', onScroll);
    update();
  }

  /* ---------- 3D tilt on preview scenes (desktop, fine pointers only) ---------- */
  function initTilt() {
    if (reducedMotion.matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('.tilt-scene').forEach(function (scene) {
      var tilt = scene.querySelector('.tilt-target');
      if (!tilt) return;

      var raf = null;
      var scrollDrift = 0;
      var current = { x: 0, y: 0 };

      function apply() {
        raf = null;
        tilt.style.transform =
          'rotateY(' + current.x.toFixed(2) + 'deg) rotateX(' + current.y.toFixed(2) + 'deg) translateY(' + scrollDrift.toFixed(1) + 'px)';
      }

      scene.addEventListener('pointermove', function (e) {
        var rect = scene.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        current.x = px * 8;   // rotateY
        current.y = -py * 6;  // rotateX
        if (!raf) raf = requestAnimationFrame(apply);
      });

      scene.addEventListener('pointerleave', function () {
        current.x = 0; current.y = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      // Subtle drift while scrolling
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var rect = scene.getBoundingClientRect();
          var vh = window.innerHeight;
          var progress = 1 - Math.min(Math.max((rect.top + rect.height * 0.3) / vh, 0), 1);
          scrollDrift = progress * -14;
          if (!raf) raf = requestAnimationFrame(apply);
        });
      }, { passive: true });
    });
  }

  /* ---------- Custom agent cursor (headset icon; fine pointers only) ---------- */
  function initAgentCursor() {
    if (reducedMotion.matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var html = document.documentElement;
    if (html.classList.contains('has-agent-cursor')) return;
    html.classList.add('has-agent-cursor');

    var badge = document.createElement('div');
    badge.className = 'agent-cursor';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML =
      '<span class="agent-cursor-ring"></span>' +
      '<span class="agent-cursor-icon">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M4 13a8 8 0 0 1 16 0"/>' +
          '<rect x="2.5" y="12.5" width="3.4" height="6" rx="1.6"/>' +
          '<rect x="18.1" y="12.5" width="3.4" height="6" rx="1.6"/>' +
          '<path d="M19.5 18.5c0 2.2-2.4 3-5.5 3"/>' +
          '<circle cx="13" cy="21.5" r="1.4"/>' +
        '</svg>' +
      '</span>';
    document.body.appendChild(badge);

    var ring = badge.querySelector('.agent-cursor-ring');
    var x = -100, y = -100, rx = -100, ry = -100;
    var scale = 1, scaleTarget = 1;
    var shown = false;

    function frame() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      scale += (scaleTarget - scale) * 0.2;
      badge.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) scale(' + scale.toFixed(3) + ')';
      requestAnimationFrame(frame);
    }

    document.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; badge.classList.add('is-visible'); }
    }, { passive: true });

    document.addEventListener('pointerover', function (e) {
      var hit = e.target && e.target.closest &&
        e.target.closest('a, button, input, select, summary, [role="button"]');
      scaleTarget = hit ? 1.35 : 1;
      badge.classList.toggle('is-active', !!hit);
    });

    document.documentElement.addEventListener('pointerleave', function () {
      badge.classList.remove('is-visible');
      shown = false;
    });

    frame();
  }

  /* ---------- Headline reveal: SplitText chars rise in ----------
     On the first visit this waits for the intro curtain (~3.2s); on repeat
     visits it plays almost immediately. Vanilla fallback: none needed — the
     headline is simply already visible if SplitText is unavailable. */
  function initHeadlineReveal(introPlayed) {
    if (reducedMotion.matches) return;

    // No SplitText: headline is already visible — start rotating the word
    // shortly after load so it still feels alive.
    if (!hasSplit) {
      window.setTimeout(initRotatingWord, 900);
      return;
    }

    var whenReady = (document.fonts && document.fonts.ready)
      ? Promise.resolve(document.fonts.ready)
      : Promise.resolve();

    whenReady.then(function () {
      var headlines = document.querySelectorAll('.hero-copy h1');
      if (!headlines.length) return;

      var delay = introPlayed ? 3.2 : 0.15;
      headlines.forEach(function (h1) {
        // words,chars: word wrappers keep line-breaks between words only —
        // bare chars would let the browser split mid-word across lines
        var split = new window.SplitText(h1, { type: 'words,chars' });
        window.gsap.from(split.chars, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.035,
          delay: delay,
          onComplete: initRotatingWord // start the word cycle once glyphs settle
        });
      });

      // The rest of the hero copy fades up just after the headline
      document.querySelectorAll('.hero-copy').forEach(function (copy) {
        var rest = copy.querySelectorAll(':scope > *:not(h1)');
        if (!rest.length) return;
        window.gsap.from(rest, {
          y: 18,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.08,
          delay: delay + 0.35
        });
      });
    }).catch(function () { /* fonts API hiccup — leave headline as-is */ });
  }

  /* ---------- Scroll progress bar (thin gold line, very top) ----------
     Vanilla rAF scroll math — works with or without Lenis. */
  function initProgressBar() {
    if (reducedMotion.matches) return;
    if (document.querySelector('.scroll-progress')) return;

    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0
        ? Math.min(Math.max((window.scrollY || doc.scrollTop || 0) / max, 0), 1)
        : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Hero particle field (canvas, dependency-free) ----------
     Gold dots that drift, link with faint lines, and shy away from the
     pointer. Pauses when the tab is hidden. */
  function initHeroParticles() {
    if (reducedMotion.matches) return;

    document.querySelectorAll('.hero').forEach(function (hero) {
      if (hero.querySelector('.hero-particles')) return;
      var canvas = document.createElement('canvas');
      canvas.className = 'hero-particles';
      canvas.setAttribute('aria-hidden', 'true');
      hero.insertBefore(canvas, hero.firstChild);

      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0, dots = [];
      var running = true, rafId = null, resizeTimer = null;
      var mouse = { x: -9999, y: -9999 };

      function size() {
        w = hero.clientWidth; h = hero.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var target = Math.min(90, Math.max(36, Math.round((w * h) / 22000)));
        dots = [];
        for (var i = 0; i < target; i++) {
          dots.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.6 + 0.6
          });
        }
      }

      function frame() {
        rafId = running ? requestAnimationFrame(frame) : null;
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        var i, d, linkDist = 110;
        for (i = 0; i < dots.length; i++) {
          d = dots[i];
          d.x += d.vx; d.y += d.vy;
          // Gentle repulsion around the pointer
          var mdx = d.x - mouse.x, mdy = d.y - mouse.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 120 && md > 0.01) {
            var f = ((120 - md) / 120) * 0.35;
            d.x += (mdx / md) * f;
            d.y += (mdy / md) * f;
          }
          if (d.x < -20) d.x = w + 20;
          if (d.x > w + 20) d.x = -20;
          if (d.y < -20) d.y = h + 20;
          if (d.y > h + 20) d.y = -20;
        }

        // Faint linking lines
        for (i = 0; i < dots.length; i++) {
          for (var j = i + 1; j < dots.length; j++) {
            var a = dots[i], b = dots[j];
            var dx = a.x - b.x, dy = a.y - b.y;
            var distSq = dx * dx + dy * dy;
            if (distSq < linkDist * linkDist) {
              var alpha = (1 - Math.sqrt(distSq) / linkDist) * 0.14;
              ctx.strokeStyle = 'rgba(224, 196, 143, ' + alpha.toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        // Dots
        ctx.fillStyle = 'rgba(224, 196, 143, 0.4)';
        for (i = 0; i < dots.length; i++) {
          d = dots[i];
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      hero.addEventListener('pointermove', function (e) {
        var rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        mouse.x = -9999; mouse.y = -9999;
      });

      window.addEventListener('resize', function () {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(size, 150);
      });
      document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
        if (running && rafId === null) rafId = requestAnimationFrame(frame);
      });

      size();
      rafId = requestAnimationFrame(frame);
    });
  }

  /* ---------- Rail lines above the step / flow grids ----------
     Gold line that grows left-to-right with scroll depth (scrub). Without
     GSAP the CSS default keeps it as a simple full-width divider. */
  function initRailLines() {
    if (reducedMotion.matches || !hasGsap) return;
    document.querySelectorAll('.rail-line').forEach(function (rail) {
      var grid = rail.parentElement.querySelector('.steps, .flow');
      if (!grid) return;
      window.gsap.fromTo(rail, { scaleX: 0 }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: grid,
          start: 'top 82%',
          end: 'bottom 65%',
          scrub: 0.4
        }
      });
    });
  }

  /* ---------- Pinned horizontal journey (desktop only) ----------
     The section pins; vertical scroll drives the track sideways, and each
     headline fills from dim ivory to full as it crosses the viewport. */
  function initHorizontalScroll() {
    if (reducedMotion.matches || !hasGsap) return;

    document.querySelectorAll('.h-scroll').forEach(function (section) {
      var track = section.querySelector('.h-track');
      if (!track) return;

      var mm = window.gsap.matchMedia();
      mm.add('(min-width: 861px)', function () {
        var dist = function () { return Math.max(track.scrollWidth - window.innerWidth, 0); };
        var end = function () { return '+=' + (dist() + window.innerHeight * 0.35); };

        var journey = window.gsap.to(track, {
          x: function () { return -dist(); },
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: end,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        var bar = section.querySelector('.h-progress span');
        if (bar) {
          window.gsap.fromTo(bar, { scaleX: 0 }, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top top', end: end, scrub: 1 }
          });
        }

        track.querySelectorAll('.h-panel h3').forEach(function (h3) {
          window.gsap.fromTo(h3,
            { color: 'rgba(242, 236, 220, 0.16)' },
            {
              color: '#F2ECDC',
              ease: 'none',
              scrollTrigger: {
                trigger: h3.closest('.h-panel'),
                containerAnimation: journey,
                start: 'left 92%',
                end: 'left 48%',
                scrub: true
              }
            }
          );
        });
      });
    });
  }

  /* ---------- Cursor spotlight (ambient gold glow behind the pointer) ---------- */
  function initSpotlight() {
    if (reducedMotion.matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var spot = document.createElement('div');
    spot.className = 'cursor-spotlight';
    spot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spot);

    var x = -600, y = -600, rx = -600, ry = -600;
    var on = false;

    document.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; spot.classList.add('is-on'); }
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', function () {
      on = false;
      spot.classList.remove('is-on');
    });

    (function loop() {
      rx += (x - rx) * 0.07;
      ry += (y - ry) * 0.07;
      spot.style.transform = 'translate3d(' + (rx - 270).toFixed(1) + 'px,' + (ry - 270).toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- ReactBits-style: Rotating Text (hero headline word) ----------
     The <em class="rot-word" data-words='[...]'> word cycles through phrases
     with a vertical roll. Started after the SplitText reveal finishes so the
     two animations never fight over the same glyphs. */
  function initRotatingWord() {
    document.querySelectorAll('.hero-copy h1 .rot-word').forEach(function (el) {
      if (el.dataset.rotBound) return;
      el.dataset.rotBound = '1';

      var words = [];
      try { words = JSON.parse(el.getAttribute('data-words') || '[]'); } catch (e) { words = []; }
      if (!words.length) return;
      if (reducedMotion.matches || words.length < 2) return;

      var span = document.createElement('span');
      span.textContent = words[0];
      el.textContent = '';
      el.appendChild(span);

      var idx = 0;
      window.setInterval(function () {
        idx = (idx + 1) % words.length;
        span.classList.add('is-leaving');
        window.setTimeout(function () {
          span.textContent = words[idx];
          span.classList.remove('is-leaving');
          span.classList.add('is-entering');
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              span.classList.remove('is-entering');
            });
          });
        }, 430);
      }, 2700);
    });
  }

  /* ---------- ReactBits-style: Blur Text (section headings resolve) ---------- */
  function initBlurText() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll(
      '.section-head h2, .h-head h2, .cta-band h2, .pricing-scope h2'
    );
    targets.forEach(function (h) {
      if (!h.dataset.blurBound) {
        h.dataset.blurBound = '1';
        h.classList.add('blur-init');
      }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.blur-init:not(.in-view)').forEach(function (h) {
      io.observe(h);
    });
  }

  /* ---------- ReactBits-style: Count Up (pricing numbers) ----------
     Elements carry .count-up + data-count. HTML holds the final value, so the
     page is correct without JS; with JS the value counts up from zero when
     the element enters the viewport. */
  function initCountUp() {
    var els = document.querySelectorAll('.count-up');
    if (!els.length) return;
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };

    els.forEach(function (el) {
      if (el.dataset.countBound) return;
      el.dataset.countBound = '1';
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;

      if (reducedMotion.matches || !hasGsap) return; // keep static final value
      el.textContent = fmt(0);
      var obj = { v: 0 };
      window.gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: function () { el.textContent = fmt(obj.v); },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  /* ---------- ReactBits-style: Magnet (CTAs pull toward the cursor) ---------- */
  function initMagnet() {
    if (reducedMotion.matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll(
      '.hero-actions .btn, .header-cta, .cta-band .btn, .pricing-scope .btn, .h-panel .btn'
    ).forEach(function (btn) {
      if (btn.dataset.magnetBound) return;
      btn.dataset.magnetBound = '1';

      var strength = 0.28;
      var max = 10;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var x = Math.max(-max, Math.min(max, dx * strength));
        var y = Math.max(-max, Math.min(max, dy * strength));
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- ReactBits-style: Glare Hover (cards get a light sweep) ---------- */
  function initGlare() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll(
      '.card, .step, .flow-node, .price-card, .info-card, .h-panel, .calc-form, .calc-results, .cta-band'
    ).forEach(function (card) {
      if (card.classList.contains('glare')) return;
      card.classList.add('glare');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--gx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- ReactBits-style: Scroll Velocity (ticker follows scroll) ----------
     JS drives the marquee transform: a slow base crawl plus a boost from the
     scroll speed — scrolling down speeds it up, scrolling up can even run it
     backwards. Falls back to the CSS keyframe animation without JS. */
  function initTickerVelocity() {
    document.querySelectorAll('.ticker').forEach(function (ticker) {
      var track = ticker.querySelector('.ticker-track');
      var group = track && track.querySelector('.ticker-group');
      if (!track || !group || track.dataset.tickerBound) return;
      track.dataset.tickerBound = '1';
      if (reducedMotion.matches) return;

      track.style.animation = 'none';
      var x = 0;
      var groupW = group.offsetWidth;
      var last = null;
      var lastScroll = window.scrollY;
      var vel = 0;

      window.addEventListener('resize', function () { groupW = group.offsetWidth; });

      function frame(now) {
        if (last === null) last = now;
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        var y = window.scrollY;
        var dv = dt > 0 ? (y - lastScroll) / dt : 0;
        lastScroll = y;
        vel += (dv - vel) * 0.08; // smooth the scroll-velocity estimate

        var speed = 60 + Math.max(-520, Math.min(520, vel * 0.35));
        x -= speed * dt;
        var w = groupW || 1;
        x = ((x % w) + w) % w;
        track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Cinematic hero: scroll parallax over the CSS/SVG scene ---------- */
  function initCinemaParallax() {
    if (!document.querySelector('.hero--cinema')) return;
    if (reducedMotion.matches || !window.gsap || !window.ScrollTrigger) return;

    var mm = window.gsap.matchMedia();
    mm.add('(min-width: 861px)', function () {
      // Sky settles slower than scroll (background), the watermark and near
      // skyline drift up faster than scroll (foreground) — that speed
      // difference is what sells the depth.
      window.gsap.to('.cinema-sky', {
        yPercent: 10,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: '.hero--cinema', start: 'top top', end: 'bottom top', scrub: true }
      });
      window.gsap.to('.cinema-moon', {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero--cinema', start: 'top top', end: 'bottom top', scrub: true }
      });
      window.gsap.to('.cinema-skyline--far', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: { trigger: '.hero--cinema', start: 'top top', end: 'bottom top', scrub: true }
      });
      window.gsap.to('.cinema-skyline--near', {
        yPercent: -16,
        ease: 'none',
        scrollTrigger: { trigger: '.hero--cinema', start: 'top top', end: 'bottom top', scrub: true }
      });
      window.gsap.to('.cinema-watermark', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: '.hero--cinema', start: 'top top', end: 'bottom top', scrub: true }
      });
      // Optional pointer parallax — a few pixels only, tuned to not fight scrub.
      if (window.matchMedia('(pointer: fine)').matches) {
        var qx = window.gsap.quickTo('.cinema-moon', 'x', { duration: 0.8, ease: 'power3.out' });
        var qy = window.gsap.quickTo('.cinema-moon', 'y', { duration: 0.8, ease: 'power3.out' });
        window.addEventListener('mousemove', function (e) {
          var nx = e.clientX / window.innerWidth - 0.5;
          var ny = e.clientY / window.innerHeight - 0.5;
          qx(nx * 14); qy(ny * 10);
        }, { passive: true });
      }
      return function () {
        window.gsap.set('.cinema-sky, .cinema-moon, .cinema-skyline, .cinema-watermark', { clearProps: 'all' });
      };
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  var played = runIntro();
  headerEntrance(played);
  initSmoothScroll();
  initMenu();
  initHeaderState();
  initReveals();
  initScrollPanels();
  initRailLines();
  initHorizontalScroll();
  initTilt();
  initAgentCursor();
  initSpotlight();
  initProgressBar();
  initHeroParticles();
  initHeadlineReveal(played);
  initCinemaParallax();
  initBlurText();
  initCountUp();
  initMagnet();
  initGlare();
  initTickerVelocity();
  initYear();
})();
