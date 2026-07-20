/* "القفزة" motion FX — count-up stats, neon cursor, magnetic buttons, card tilt.
   Count-up runs everywhere (static under reduced-motion); pointer effects are
   desktop-only and disabled for reduced-motion & touch. Tiny, dependency-free. */
(function () {
  'use strict';
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Count-up stats (all devices) ---- */
  function countUp() {
    var nums = document.querySelectorAll('.stat-number');
    if (!nums.length || typeof IntersectionObserver === 'undefined') return;
    function run(el) {
      var m = el.textContent.trim().match(/^([^\d]*?)([\d,]+)(.*)$/);
      if (!m) return;
      var pre = m[1], target = parseInt(m[2].replace(/,/g, ''), 10), suf = m[3];
      if (isNaN(target) || reduced) return; // leave the authored value static
      var dur = 1400, s = null;
      function tick(ts) {
        if (!s) s = ts;
        var p = Math.min((ts - s) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(target * e) + suf;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', countUp);
  else countUp();

  /* ---- Pointer effects: desktop only, motion-safe ---- */
  if (!fine || reduced) return;

  /* Neon cursor */
  document.body.classList.add('neon-cursor-on');
  var cur = document.createElement('div');
  cur.className = 'neon-cursor';
  cur.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cur);
  var tx = -100, ty = -100, cx = -100, cy = -100, hover = false;
  var HOVER = 'a,button,input,textarea,select,label,.hero-btn,.service-chip,' +
              '.feature-card,.stat-card,.how-step,.pm-card,.cond-btn,.urgency-btn,.category-card';
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY;
    var t = e.target;
    hover = !!(t && t.closest && t.closest(HOVER));
  });
  (function loop() {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%) scale(' + (hover ? 2.2 : 1) + ')';
    cur.style.borderColor = hover ? '#7c3aed' : '#22d3ee';
    requestAnimationFrame(loop);
  })();

  /* Magnetic CTAs */
  function bindMagnetic() {
    document.querySelectorAll('.hero-btn, .services-btn, .submit-btn, .banner-btn, .cta-btn, .pricing-btn')
      .forEach(function (el) {
        if (el.__mag) return;
        el.__mag = true;
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          el.style.transform = 'translate(' + (e.clientX - (r.left + r.width / 2)) * 0.25 + 'px,' +
                                              (e.clientY - (r.top + r.height / 2)) * 0.25 + 'px)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      });
  }

  /* Subtle 3D tilt on cards */
  function bindTilt() {
    document.querySelectorAll('.feature-card, .stat-card, .category-card, .how-step, .benefit-card')
      .forEach(function (el) {
        if (el.__tilt) return;
        el.__tilt = true;
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(720px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 5).toFixed(2) + 'deg) translateY(-4px)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      });
  }

  function bindAll() { bindMagnetic(); bindTilt(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAll);
  else bindAll();
  document.addEventListener('dawerli:langChanged', bindAll);
})();
