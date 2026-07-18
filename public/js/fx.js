/* "القفزة" motion FX — neon cursor + magnetic buttons.
   Gated: desktop pointer only, disabled for prefers-reduced-motion & touch.
   Tiny, dependency-free, rAF-throttled. */
(function () {
  'use strict';
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return;

  /* ---- Neon cursor ---- */
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

  /* ---- Magnetic CTAs ---- */
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindMagnetic);
  else bindMagnetic();
  document.addEventListener('dawerli:langChanged', bindMagnetic);
})();
