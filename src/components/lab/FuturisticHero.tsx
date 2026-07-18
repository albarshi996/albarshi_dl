import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import './hero.css';

const WA = 'https://wa.me/218946507954';

/* ---------- Neon custom cursor (desktop only) ---------- */
function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setEnabled(true);
    const mv = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHover(!!(t && t.closest && t.closest('[data-cursor="hover"]')));
    };
    window.addEventListener('pointermove', mv);
    return () => window.removeEventListener('pointermove', mv);
  }, [x, y]);

  if (!enabled) return null;
  return (
    <motion.div
      className="hero-cursor"
      aria-hidden="true"
      style={{ x: sx, y: sy }}
      animate={{ scale: hover ? 2.4 : 1, opacity: hover ? 0.6 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    />
  );
}

/* ---------- Particle constellation ---------- */
function ParticleField({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    let pts: { x: number; y: number; vx: number; vy: number }[] = [];

    const countFor = () => Math.min(64, Math.floor((w * h) / 26000));
    function resize() {
      w = canvas!.clientWidth; h = canvas!.clientHeight;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      pts = [];
      const n = countFor();
      for (let i = 0; i < n; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22 });
      }
    }
    function render() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx!.strokeStyle = `rgba(34,211,238,${(1 - d / 130) * 0.13})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx!.fillStyle = 'rgba(124,58,237,0.55)';
        ctx!.beginPath(); ctx!.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx!.fill();
      }
    }
    function step() {
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      render();
      raf = requestAnimationFrame(step);
    }

    resize(); seed();
    if (reduced) render(); else step();
    const onResize = () => { resize(); seed(); if (reduced) render(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [reduced]);
  return <canvas ref={ref} className="hero-particles" aria-hidden="true" />;
}

/* ---------- Magnetic button ---------- */
function Magnetic({ href, className, children }: { href: string; className: string; children: any }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const move = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const leave = () => { x.set(0); y.set(0); };
  return (
    <motion.a
      ref={ref} href={href} className={className} data-cursor="hover"
      target="_blank" rel="noopener noreferrer"
      style={{ x: sx, y: sy }} onMouseMove={move} onMouseLeave={leave}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.a>
  );
}

/* ---------- Tilt glass card ---------- */
function TiltCard({ reduced }: { reduced: boolean }) {
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 15 });
  const sry = useSpring(ry, { stiffness: 150, damping: 15 });
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 16); rx.set(-py * 16);
  };
  const leave = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div
      ref={ref} className="tilt-card" data-cursor="hover"
      onMouseMove={move} onMouseLeave={leave}
      style={{ rotateX: srx, rotateY: sry }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="tc-glow" aria-hidden="true" />
      <div className="tc-head"><span className="tc-dot" /> دورلي · تتبّع مباشر</div>
      <div className="tc-order">طلب #DW-2026-4821</div>
      <div className="tc-cat">🚗 قطع غيار سيارات</div>
      <div className="tc-steps">
        {['استلام', 'تسعير', 'شراء', 'توصيل'].map((s, i) => (
          <div key={s} className={'tc-step' + (i <= 2 ? ' done' : '')}>
            <span className="tc-step-dot" /><span>{s}</span>
          </div>
        ))}
      </div>
      <div className="tc-bar"><div className="tc-bar-fill" /></div>
      <div className="tc-eta">الوصول المتوقّع · اليوم ٦:٤٠م</div>
    </motion.div>
  );
}

/* ---------- Hero ---------- */
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const rise = {
  hidden: { opacity: 0, y: 26, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function FuturisticHero() {
  const reduced = !!useReducedMotion();
  const words = ['نبحث.', 'نشتري.', 'نوصّل', 'لبابك.'];
  const chips = [
    { n: '٦', t: 'فئات خدمية' },
    { n: '+٣٠', t: 'خدمة متوفّرة' },
    { n: '٢٤/٧', t: 'عبر واتساب' },
  ];
  return (
    <main className="hero-root">
      <CustomCursor />
      <div className="hero-aurora" aria-hidden="true">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      </div>
      <div className="hero-grid" aria-hidden="true" />
      <ParticleField reduced={reduced} />

      <span className="poc-badge">نموذج أولي · PoC</span>

      <motion.div className="hero-content" variants={container} initial="hidden" animate="show">
        <motion.a className="eyebrow" href={WA} target="_blank" rel="noopener noreferrer" data-cursor="hover" variants={rise}>
          <span className="eyebrow-dot" /> منصّة التوصيل الليبية
        </motion.a>

        <h1 className="headline" dir="rtl">
          {words.map((w, i) => (
            <motion.span key={i} className={'word' + (i >= 2 ? ' glow' : '')} variants={rise}>
              {w}{' '}
            </motion.span>
          ))}
        </h1>

        <motion.p className="sub" variants={rise}>
          من أي مدينة في ليبيا — قطع غيار، تسوّق، مستندات، ومستلزمات. نبحث لك،
          نشتري نيابةً عنك، ونوصّل حتى بابك.
        </motion.p>

        <motion.div className="cta-row" variants={rise}>
          <Magnetic href={WA} className="btn-primary">
            <span className="btn-ic">💬</span> اطلب الآن عبر واتساب
          </Magnetic>
          <a className="btn-ghost" href="#services" data-cursor="hover">تصفّح الخدمات</a>
        </motion.div>

        <motion.div className="chips" variants={rise}>
          {chips.map((c) => (
            <div className="chip" key={c.t}>
              <span className="chip-n">{c.n}</span><span className="chip-t">{c.t}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="hero-visual">
        <TiltCard reduced={reduced} />
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <span>مرّر للأسفل</span><span className="sh-line" />
      </div>
    </main>
  );
}
