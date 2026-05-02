/**
 * mobile-nav.js — Dawerli Mobile Drawer Navigation v5.1
 *
 * CRITICAL FIX v5.1:
 *   — Debounced MutationObserver (prevent double-firing on lang switch)
 *   — nav.no-transition freezes CSS transitions during direction change
 *     to prevent the RTL→LTR "fly-in" visual crash
 *   — Double requestAnimationFrame ensures browser has repainted before
 *     re-enabling transitions
 *
 * Features:
 *   ✅ Overlay (tap to close)
 *   ✅ Swipe-to-close gesture (touch, RTL + LTR aware)
 *   ✅ RTL drawer from RIGHT (Arabic default)
 *   ✅ LTR drawer from LEFT (English — css html[lang="en"] nav)
 *   ✅ Body scroll lock while drawer is open
 *   ✅ Escape key closes drawer
 *   ✅ Resize to desktop auto-closes
 *   ✅ Safe on Header.astro applyHeaderLang()
 *   ✅ Hijacks #mobileMenuBtn → removes stale initMobileMenu() listener
 */
(function () {
  'use strict';

  var nav             = null;
  var overlay         = null;
  var menuBtn         = null;
  var closeBtn        = null;
  var isOpen          = false;
  var touchStartX     = 0;
  var touchStartY     = 0;
  var SWIPE_THRESHOLD = 55;       // px — calibrated for natural gesture
  var _dirPending     = false;    // debounce flag for MutationObserver

  /* ─── Helpers ──────────────────────────────────────────────────────── */
  function getDir() {
    return document.documentElement.dir === 'ltr' ? 'ltr' : 'rtl';
  }

  function setIcon(open) {
    if (!menuBtn) return;
    var i = menuBtn.querySelector('i');
    if (!i) return;
    i.classList.remove(open ? 'fa-bars' : 'fa-times');
    i.classList.add(   open ? 'fa-times' : 'fa-bars');
  }

  /* ─── Open / Close ──────────────────────────────────────────────────── */
  function openDrawer() {
    if (isOpen || !nav || !overlay) return;
    isOpen = true;
    nav.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('drawer-open');
    setIcon(true);
    try { menuBtn && menuBtn.setAttribute('aria-expanded', 'true'); } catch(e) {}
    try { nav.setAttribute('aria-hidden', 'false'); } catch(e) {}
  }

  function closeDrawer() {
    if (!isOpen || !nav || !overlay) return;
    isOpen = false;
    nav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('drawer-open');
    setIcon(false);
    try { menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); } catch(e) {}
    try { nav.setAttribute('aria-hidden', 'true'); } catch(e) {}
  }

  /* ─── DOM builders ──────────────────────────────────────────────────── */
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(overlay, document.body.firstChild);
    overlay.addEventListener('click', closeDrawer);
  }

  function buildCloseBtn() {
    closeBtn = document.createElement('button');
    closeBtn.id = 'drawerCloseBtn';
    closeBtn.className = 'drawer-close-btn';
    closeBtn.setAttribute('aria-label',
      getDir() === 'ltr' ? 'Close menu' : '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629');
    closeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeDrawer();
    });
    nav.insertBefore(closeBtn, nav.firstChild);
  }

  /* ─── Hijack menu button ─────────────────────────────────────────────
     Clones #mobileMenuBtn removing all listeners (incl. initMobileMenu
     from script.js) to prevent the double-toggle conflict.            */
  function hijackMenuBtn() {
    var old = document.getElementById('mobileMenuBtn')
           || document.querySelector('.mobile-menu-btn');
    if (!old) return null;
    var fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    fresh.setAttribute('aria-expanded', 'false');
    fresh.setAttribute('aria-controls', 'mainNav');
    fresh.setAttribute('aria-label',    '\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629');
    fresh.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeDrawer() : openDrawer();
    });
    return fresh;
  }

  /* ─── Nav link close ────────────────────────────────────────────────── */
  function bindNavLinks() {
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ─── Swipe gesture ─────────────────────────────────────────────────── */
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (!isOpen) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < Math.abs(dy)) return;       // ignore vertical
    var dir = getDir();
    if (dir === 'rtl' && dx < -SWIPE_THRESHOLD) { closeDrawer(); return; }
    if (dir === 'ltr' && dx >  SWIPE_THRESHOLD) { closeDrawer(); return; }
  }

  /* ─── Direction change handler ──────────────────────────────────────
     THE CORE FIX:
     applyHeaderLang() in Header.astro sets BOTH html[lang] AND html[dir].
     MutationObserver fires once per attribute → 2 callbacks per switch.
     Without the debounce (_dirPending), the nav processes twice and
     CSS transitions interact badly → visual "crash" (nav flies in).

     Fix:
     1. _dirPending flag: only first mutation in each batch processes
     2. nav.no-transition: ALL nav transitions are instantly disabled
        BEFORE the new CSS direction rule reflows the element.
        This prevents the RTL→LTR "fly-in" glitch.
     3. Double rAF: ensures browser has fully repainted with new position
        before we re-enable transitions (single rAF is insufficient).  */
  function onDirChange() {
    if (_dirPending) return;       // ← debounce: skip 2nd mutation
    _dirPending = true;

    /* Freeze transitions so the position snap is invisible */
    if (nav) nav.classList.add('no-transition');

    if (isOpen) closeDrawer();

    if (closeBtn) {
      try {
        closeBtn.setAttribute('aria-label',
          getDir() === 'ltr' ? 'Close menu'
                             : '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629');
      } catch(e) {}
    }

    /* Double rAF: frame 1 = browser applies new CSS; frame 2 = painted */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (nav) nav.classList.remove('no-transition');
        _dirPending = false;
      });
    });
  }

  /* ─── Observers & global events ─────────────────────────────────────── */
  function observeDirection() {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var attr = mutations[i].attributeName;
        if (attr === 'dir' || attr === 'lang') {
          onDirChange();
          break; // one call per batch is enough
        }
      }
    });
    obs.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['dir', 'lang']
    });
  }

  function bindGlobal() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992 && isOpen) closeDrawer();
    }, { passive: true });
    document.addEventListener('dawerli:langChanged', function () {
      if (isOpen) closeDrawer();
    });
  }

  /* ─── Init ────────────────────────────────────────────────────────── */
  function init() {
    nav = document.getElementById('mainNav');
    if (!nav) return;
    buildOverlay();
    menuBtn = hijackMenuBtn();
    buildCloseBtn();
    bindNavLinks();
    nav.addEventListener('touchstart', onTouchStart, { passive: true });
    nav.addEventListener('touchend',   onTouchEnd,   { passive: true });
    observeDirection();
    bindGlobal();
    try { nav.setAttribute('aria-hidden', 'true'); } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
