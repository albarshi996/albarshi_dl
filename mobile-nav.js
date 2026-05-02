/**
 * mobile-nav.js — Dawerli Mobile Drawer Navigation v5.3
 *
 * v5.3 ROOT CAUSE FIXES:
 *
 *   ① Stacking Context Trap:
 *     header { backdrop-filter: blur(16px) } creates a CSS Stacking Context.
 *     nav inside header was trapped in that context (effective root z-index
 *     = header's 1000). Overlay raised to 1003 in Task 5.2 → overlay above
 *     nav → overlay's backdrop-filter blurred the nav → frozen/blurry UI.
 *     FIX: document.body.appendChild(nav) — nav moves to root context.
 *
 *   ② touch-action:none Scroll Lock (Task 5 CSS):
 *     Blocked tap→click conversion on iOS Safari for overlay/close btn.
 *     Swipe (raw touchstart/touchend) still worked — consistent with report.
 *     FIX: JS position:fixed scroll lock. No touch-action needed.
 *
 *   ③ iOS Tap Reliability (v5.2 retained):
 *     touchend on overlay, close btn, menu btn with { passive: false }.
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
  var SWIPE_THRESHOLD = 55;
  var _dirPending     = false;
  var _scrollY        = 0;         // saved scroll position for JS scroll lock

  /* ─── Helpers ─────────────────────────────────────────────────────── */
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

  /* ─── Scroll lock (JS position:fixed technique) ─────────────────────
     Does NOT use touch-action:none — that blocks tap events on iOS.
     Instead: freeze body in place by position:fixed + negative top.    */
  function lockScroll() {
    _scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top      = '-' + _scrollY + 'px';
    document.body.style.width    = '100%';
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.width    = '';
    window.scrollTo(0, _scrollY);
  }

  /* ─── Open / Close ─────────────────────────────────────────────────── */
  function openDrawer() {
    if (isOpen || !nav || !overlay) return;
    isOpen = true;
    nav.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('drawer-open');
    lockScroll();
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
    unlockScroll();
    setIcon(false);
    try { menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); } catch(e) {}
    try { nav.setAttribute('aria-hidden', 'true'); } catch(e) {}
  }

  /* ─── Overlay ──────────────────────────────────────────────────────── */
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    /* click: desktop + Android Chrome */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeDrawer();
    });

    /* touchend: iOS Safari — tap→click gap fix */
    overlay.addEventListener('touchend', function(e) {
      if (e.target === overlay) {
        e.preventDefault();
        closeDrawer();
      }
    }, { passive: false });
  }

  /* ─── Close button ─────────────────────────────────────────────────── */
  function buildCloseBtn() {
    closeBtn = document.createElement('button');
    closeBtn.id        = 'drawerCloseBtn';
    closeBtn.className = 'drawer-close-btn';
    closeBtn.setAttribute('aria-label',
      getDir() === 'ltr' ? 'Close menu'
                         : 'إغلاق القائمة');
    closeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeDrawer();
    });

    closeBtn.addEventListener('touchend', function(e) {
      e.stopPropagation();
      e.preventDefault();
      closeDrawer();
    }, { passive: false });

    nav.insertBefore(closeBtn, nav.firstChild);
  }

  /* ─── Hijack menu button ─────────────────────────────────────────────
     Clones #mobileMenuBtn removing all listeners (incl. initMobileMenu). */
  function hijackMenuBtn() {
    var old = document.getElementById('mobileMenuBtn')
           || document.querySelector('.mobile-menu-btn');
    if (!old) return null;
    var fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    fresh.setAttribute('aria-expanded', 'false');
    fresh.setAttribute('aria-controls', 'mainNav');
    fresh.setAttribute('aria-label', 'فتح القائمة');

    fresh.addEventListener('click', function(e) {
      e.stopPropagation();
      isOpen ? closeDrawer() : openDrawer();
    });
    fresh.addEventListener('touchend', function(e) {
      e.stopPropagation();
      e.preventDefault();
      isOpen ? closeDrawer() : openDrawer();
    }, { passive: false });

    return fresh;
  }

  /* ─── Nav links ────────────────────────────────────────────────────── */
  function bindNavLinks() {
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ─── Swipe gesture ────────────────────────────────────────────────── */
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (!isOpen) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < Math.abs(dy)) return;
    var dir = getDir();
    if (dir === 'rtl' && dx < -SWIPE_THRESHOLD) { closeDrawer(); return; }
    if (dir === 'ltr' && dx >  SWIPE_THRESHOLD) { closeDrawer(); return; }
  }

  /* ─── Direction change (MutationObserver) ───────────────────────────
     Debounces the double-mutation (lang + dir both change on lang switch).
     Freezes nav transitions during the switch to prevent RTL→LTR fly-in. */
  function onDirChange() {
    if (_dirPending) return;
    _dirPending = true;
    if (nav) nav.classList.add('no-transition');
    if (isOpen) closeDrawer();
    if (closeBtn) {
      try {
        closeBtn.setAttribute('aria-label',
          getDir() === 'ltr' ? 'Close menu'
                             : 'إغلاق القائمة');
      } catch(e) {}
    }
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(function() {
        if (nav) nav.classList.remove('no-transition');
        _dirPending = false;
      });
    });
  }

  function observeDirection() {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var attr = mutations[i].attributeName;
        if (attr === 'dir' || attr === 'lang') { onDirChange(); break; }
      }
    });
    obs.observe(document.documentElement, {
      attributes: true, attributeFilter: ['dir', 'lang']
    });
  }

  /* ─── Global events ────────────────────────────────────────────────── */
  function bindGlobal() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    });
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 992 && isOpen) closeDrawer();
    }, { passive: true });
    document.addEventListener('dawerli:langChanged', function() {
      if (isOpen) closeDrawer();
    });
  }

  /* ─── Init ──────────────────────────────────────────────────────────
     CRITICAL: nav is moved to document.body FIRST.
     header { backdrop-filter: blur(16px) } creates a CSS Stacking Context.
     Any position:fixed child of header is trapped in that context — its
     z-index cannot exceed the header's root-level z-index (1000).
     Moving nav to body places it in the ROOT stacking context where
     z-index: 1001 > overlay(999) and > header(1000). No blur. ✓         */
  function init() {
    nav = document.getElementById('mainNav');
    if (!nav) return;

    /* Escape header's stacking context — only on mobile (<992px).
       On desktop the nav stays in the header flex layout (no stacking issue).
       TASK 11.6: fix — nav was always body-appended, causing it to render
       as a static block below the footer on desktop screens.               */
    if (window.innerWidth < 992) {
      document.body.appendChild(nav);
    }

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
