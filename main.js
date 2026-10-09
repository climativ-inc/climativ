/* Climativ — interactions et animations du site */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- Défilement : en-tête, progression, parallaxe ---------- */
  var header = $('[data-header]');
  var progress = $('[data-progress]');
  var heroMedia = $('[data-hero-media]');
  var parallaxEls = $$('[data-parallax]');
  var stepsWrap = $('[data-steps]');
  var steps = $$('.step');
  var mobileBar = $('[data-mobile-bar]');
  var hero = $('[data-hero]');
  var lastY = window.scrollY;
  var ticking = false;
  var isSimple = document.body.classList.contains('page-simple');

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;

    if (header && !isSimple) {
      header.classList.toggle('is-solid', y > 40);
      var goingDown = y > lastY;
      var menuOpen = root.classList.contains('menu-open');
      header.classList.toggle('is-hidden', goingDown && y > 640 && !menuOpen);
    }

    if (progress) {
      var max = document.documentElement.scrollHeight - vh;
      progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    }

    if (!reduce && heroMedia && y < vh * 1.2) {
      heroMedia.style.setProperty('--py', (y * 0.28).toFixed(1) + 'px');
    }

    if (!reduce) {
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var t = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
        el.style.setProperty('--py', (-8 + t * 7).toFixed(2) + '%');
      });
    }

    if (stepsWrap) {
      var sr = stepsWrap.getBoundingClientRect();
      var p = Math.min(Math.max((vh * 0.82 - sr.top) / (sr.height + vh * 0.2), 0), 1);
      stepsWrap.style.setProperty('--line', p.toFixed(3));
      steps.forEach(function (s, i) {
        s.classList.toggle('is-on', p >= (i / Math.max(steps.length - 1, 1)) * 0.92 + 0.02);
      });
    }

    if (mobileBar && hero) {
      mobileBar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
    }

    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = $('[data-menu-toggle]');
  var nav = $('[data-nav]');
  if (toggle && nav) {
    var setMenu = function (open) {
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.sr-only').textContent = open ? 'Fermer le menu' : 'Menu';
    };
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
  }

  /* ---------- Accueil : été / hiver ---------- */
  var thermo = $('[data-thermo]');
  if (hero && thermo) {
    var seasons = {
      froid: { label: 'Climatisation', out: 31, inside: 21 },
      chaud: { label: 'Chauffage', out: -25, inside: 22 }
    };
    var outEl = $('[data-temp-out]', thermo);
    var inEl = $('[data-temp-in]', thermo);
    var labelEl = $('[data-thermo-label]', thermo);
    var buttons = $$('[data-season]', thermo);
    var mode = 'froid';
    var CYCLE = 5000;
    var timer = null;
    var heroVisible = true;

    var countTo = function (el, to) {
      var from = parseInt(el.textContent, 10) || 0;
      if (reduce) { el.textContent = to; return; }
      var start = null;
      var dur = 900;
      var step = function (ts) {
        if (!start) start = ts;
        var k = Math.min((ts - start) / dur, 1);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * e);
        if (k < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    var setMode = function (m) {
      mode = m;
      hero.setAttribute('data-mode', m);
      labelEl.textContent = seasons[m].label;
      countTo(outEl, seasons[m].out);
      countTo(inEl, seasons[m].inside);
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-season') === m)); });
      var bar = $('.thermo__bar span', thermo);
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    };

    var schedule = function () {
      window.clearTimeout(timer);
      if (reduce) return;
      timer = window.setTimeout(function () {
        if (heroVisible && !document.hidden && !thermo.matches(':hover')) setMode(mode === 'froid' ? 'chaud' : 'froid');
        schedule();
      }, CYCLE);
    };

    thermo.style.setProperty('--cycle', CYCLE + 'ms');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-season')); schedule(); });
    });
    thermo.addEventListener('mouseenter', function () { thermo.classList.add('is-paused'); });
    thermo.addEventListener('mouseleave', function () { thermo.classList.remove('is-paused'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { heroVisible = entries[0].isIntersecting; }).observe(hero);
    }
    if (reduce) thermo.classList.add('is-paused');
    window.setTimeout(schedule, 1800);
  }

  /* ---------- Titres mot par mot ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      var m = w.match(/^(.*?)([.,:;!?]+)$/);
      var inner = m && m[1] ? m[1] + '<span class="p">' + m[2] + '</span>' : w;
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + inner + '</span></span>';
    }).join(' ');
  });

  /* ---------- Apparitions au défilement ---------- */
  var revealEls = $$('[data-reveal], [data-split]');
  var groups = new Map();
  $$('[data-reveal]').forEach(function (el) {
    var p = el.parentElement;
    var n = groups.get(p) || 0;
    el.style.setProperty('--d', Math.min(n * 0.08, 0.48) + 's');
    groups.set(p, n + 1);
  });
  var onReveal = function (el) {
    el.classList.add('is-in');
    $$('[data-count]', el).forEach(countUp);
    if (el.hasAttribute('data-ba')) sweep(el);
  };
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { onReveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Compteurs ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseInt(el.getAttribute('data-count'), 10);
    if (reduce) { el.textContent = to; return; }
    var start = null;
    var dur = 1600;
    el.textContent = '0';
    var step = function (ts) {
      if (!start) start = ts;
      var k = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
      if (k < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  /* ---------- Effet projecteur sur les cartes ---------- */
  if (finePointer) {
    $$('[data-spotlight]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Comparateur avant / après ---------- */
  var touched = new WeakSet();
  $$('[data-ba]').forEach(function (ba) {
    var range = $('.ba__range', ba);
    var update = function () { ba.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', function () { touched.add(ba); update(); });
    range.addEventListener('pointerdown', function () { touched.add(ba); });
    update();
  });
  // Petit balayage automatique la première fois qu'on voit le comparateur
  function sweep(ba) {
    if (reduce) return;
    var range = $('.ba__range', ba);
    var keys = [[0, 50], [900, 82], [2100, 18], [3100, 50]];
    var start = null;
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var step = function (ts) {
      if (touched.has(ba)) return;
      if (!start) start = ts + 400;
      var t = ts - start;
      if (t < 0) { window.requestAnimationFrame(step); return; }
      for (var i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          var a = keys[i - 1], b = keys[i];
          var k = ease((t - a[0]) / (b[0] - a[0]));
          var v = a[1] + (b[1] - a[1]) * k;
          range.value = v;
          ba.style.setProperty('--pos', v + '%');
          window.requestAnimationFrame(step);
          return;
        }
      }
      range.value = 50;
      ba.style.setProperty('--pos', '50%');
    };
    window.requestAnimationFrame(step);
  }

  /* ---------- FAQ : ouverture animée ---------- */
  $$('[data-accordion] details').forEach(function (d) {
    var summary = $('summary', d);
    var body = $('.accordion__body', d);
    if (!summary || !body || reduce || !body.animate) return;
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        var anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var full = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: full + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- Galerie + visionneuse ---------- */
  var lightbox = $('[data-lightbox]');
  var items = $$('[data-gallery] .gallery__item');
  if (lightbox && items.length && typeof lightbox.showModal === 'function') {
    var lbImg = $('[data-lightbox-img]', lightbox);
    var lbCap = $('[data-lightbox-cap]', lightbox);
    var current = 0;
    var lastFocus = null;
    var show = function (i) {
      current = (i + items.length) % items.length;
      var item = items[current];
      var thumb = $('img', item);
      lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
      lbImg.src = item.getAttribute('data-full');
      lbImg.alt = thumb.alt;
      lbCap.textContent = $('.gallery__cap', item).textContent + '  (' + (current + 1) + ' / ' + items.length + ')';
    };
    items.forEach(function (item, i) {
      item.addEventListener('click', function () {
        lastFocus = item; show(i); lightbox.showModal();
        root.style.overflow = 'hidden';
      });
    });
    $('[data-lightbox-prev]', lightbox).addEventListener('click', function () { show(current - 1); });
    $('[data-lightbox-next]', lightbox).addEventListener('click', function () { show(current + 1); });
    $('[data-lightbox-close]', lightbox).addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) lightbox.close();
    });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    lightbox.addEventListener('close', function () { root.style.overflow = ''; if (lastFocus) lastFocus.focus(); });
    var startX = null;
    lightbox.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ---------- Formulaire de soumission en étapes ---------- */
  var form = $('[data-quote]');
  if (form) {
    var fSteps = $$('[data-step]', form);
    var total = fSteps.length;
    var index = 0;
    var bar = $('[data-bar]', form);
    var count = $('[data-step-count]', form);
    var stepError = $('[data-step-error]', form);
    var submitError = $('[data-submit-error]', form);
    var urgent = $('[data-urgent]', form);
    var done = $('[data-done]');
    var card = form.parentElement;

    var goTo = function (i, focus) {
      index = Math.max(0, Math.min(i, total - 1));
      fSteps.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      form.classList.toggle('is-first', index === 0);
      form.classList.toggle('is-last', index === total - 1);
      bar.style.width = ((index + 1) / total * 100) + '%';
      count.textContent = 'Étape ' + (index + 1) + ' sur ' + total;
      stepError.hidden = true;
      if (focus) {
        var legend = $('.quote__q', fSteps[index]);
        legend.setAttribute('tabindex', '-1');
        legend.focus({ preventScroll: true });
        var top = card.getBoundingClientRect().top;
        if (top < 80) window.scrollBy({ top: top - 100, behavior: 'smooth' });
      }
    };
    var radiosValid = function (step) {
      var radios = $$('input[type="radio"]', step);
      return !radios.length || radios.some(function (r) { return r.checked; });
    };
    var fieldValid = function (input) {
      var field = input.closest('.field');
      var value = input.value.trim();
      var ok = true;
      if (input.required && !value) ok = false;
      if (ok && input.name === 'telephone') ok = value.replace(/\D/g, '').length >= 10;
      if (ok && input.type === 'email' && value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (field) field.classList.toggle('is-invalid', !ok);
      return ok;
    };
    var stepValid = function (step) {
      if (!radiosValid(step)) { stepError.hidden = false; return false; }
      var firstBad = null;
      $$('.field input', step).forEach(function (inp) { if (!fieldValid(inp) && !firstBad) firstBad = inp; });
      if (firstBad) { firstBad.focus(); return false; }
      return true;
    };

    $('[data-next]', form).addEventListener('click', function () { if (stepValid(fSteps[index])) goTo(index + 1, true); });
    $('[data-prev]', form).addEventListener('click', function () { goTo(index - 1, true); });

    $$('.choice input', form).forEach(function (radio) {
      radio.addEventListener('change', function () {
        stepError.hidden = true;
        if (radio.name === 'projet') urgent.hidden = radio.value !== 'Urgence';
      });
      radio.closest('.choice').addEventListener('click', function (e) {
        if (e.detail === 0) return; // clavier : pas d'avance automatique
        var step = radio.closest('[data-step]');
        var n = fSteps.indexOf(step);
        if (radio.name === 'projet' && radio.value === 'Urgence') return;
        if (step.querySelector('textarea')) return;
        window.setTimeout(function () { if (index === n && radio.checked) goTo(n + 1, true); }, 280);
      });
    });
    $$('.field input', form).forEach(function (inp) {
      inp.addEventListener('blur', function () { if (inp.value) fieldValid(inp); });
      inp.addEventListener('input', function () { if (inp.closest('.field').classList.contains('is-invalid')) fieldValid(inp); });
    });

    $$('[data-preselect]').forEach(function (link) {
      link.addEventListener('click', function () {
        var value = link.getAttribute('data-preselect');
        var radio = $$('input[name="projet"]', form).filter(function (r) { return r.value === value; })[0];
        if (radio) { radio.checked = true; urgent.hidden = true; goTo(1, false); }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!stepValid(fSteps[index])) return;
      for (var i = 0; i < total; i++) {
        if (!radiosValid(fSteps[i])) { goTo(i, true); stepError.hidden = false; return; }
      }
      var submitBtn = $('[data-submit]', form);
      submitBtn.disabled = true;
      submitBtn.firstChild.textContent = 'Envoi en cours…';
      submitError.hidden = true;
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var name = (form.elements.nom.value || '').trim().split(' ')[0];
        var tel = (form.elements.telephone.value || '').trim();
        $('[data-done-msg]').textContent = 'Merci' + (name ? ' ' + name : '') + '! On vous rappelle rapidement au ' + tel + ' pour discuter de votre projet.';
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }).catch(function () {
        submitError.hidden = false;
        submitBtn.disabled = false;
        submitBtn.firstChild.textContent = 'Envoyer ma demande';
      });
    });

    goTo(0, false);
  }

  /* ---------- Barre mobile : cachée sur la section soumission ---------- */
  var quoteSection = $('#soumission');
  if (mobileBar && quoteSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      mobileBar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.1 }).observe(quoteSection);
  }

  /* ---------- Année du pied de page ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
