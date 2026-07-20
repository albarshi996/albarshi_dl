/* Hero particle constellation (home) — vanilla, reduced-motion aware, self-sizing.
   Loaded as an external script (reliable pattern, like /script.js). No-ops off the home. */
(function () {
  'use strict';
  function init() {
    var canvas = document.getElementById('heroParticles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = 0, h = 0, raf = 0, pts = [];
    function resize() { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function seed() { pts = []; var n = Math.min(58, Math.floor((w * h) / 28000)); for (var i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 }); }
    function render() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) { var a = pts[i]; for (var j = i + 1; j < pts.length; j++) { var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 128) { ctx.strokeStyle = 'rgba(34,211,238,' + (1 - d / 128) * 0.12 + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } } }
      for (var k = 0; k < pts.length; k++) { var p = pts[k]; ctx.fillStyle = 'rgba(124,58,237,0.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill(); }
    }
    function step() { for (var i = 0; i < pts.length; i++) { var p = pts[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; } render(); raf = requestAnimationFrame(step); }
    function start() { cancelAnimationFrame(raf); resize(); seed(); if (reduced) render(); else step(); }
    start();
    if (typeof ResizeObserver !== 'undefined') { new ResizeObserver(start).observe(canvas); }
    window.addEventListener('resize', start);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
