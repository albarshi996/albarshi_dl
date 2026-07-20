import { useEffect, useRef } from 'react';
import './herofx.css';

/**
 * Decorative hero atmosphere for the home page — aurora blobs + masked tech grid
 * + a light particle constellation. Background only (pointer-events:none, aria-hidden),
 * so it never interferes with the real (translatable, SEO) hero content layered above.
 * Loaded via client:visible; freezes for prefers-reduced-motion.
 */
export default function HeroFX() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    let pts: { x: number; y: number; vx: number; vy: number }[] = [];
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () => {
      pts = [];
      const n = Math.min(58, Math.floor((w * h) / 28000));
      for (let i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 });
    };
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 128) { ctx.strokeStyle = `rgba(34,211,238,${(1 - d / 128) * 0.12})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      for (const p of pts) { ctx.fillStyle = 'rgba(124,58,237,0.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill(); }
    };
    const step = () => {
      for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
      render(); raf = requestAnimationFrame(step);
    };
    const start = () => { cancelAnimationFrame(raf); resize(); seed(); if (reduced) render(); else step(); };
    requestAnimationFrame(start);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(start) : null;
    if (ro) ro.observe(canvas);
    window.addEventListener('resize', start);
    return () => { cancelAnimationFrame(raf); if (ro) ro.disconnect(); window.removeEventListener('resize', start); };
  }, []);

  return (
    <div className="herofx" aria-hidden="true">
      <div className="fx-aurora">
        <span className="fx-blob fx-b1" /><span className="fx-blob fx-b2" /><span className="fx-blob fx-b3" />
      </div>
      <div className="fx-grid" />
      <canvas ref={ref} className="fx-particles" />
    </div>
  );
}
