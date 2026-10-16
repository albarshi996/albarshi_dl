/* Count-up stats — the one motion effect kept site-wide.
   Static under prefers-reduced-motion. Tiny, dependency-free. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
})();
