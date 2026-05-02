/**
 * mobile-nav.js — Dawerli Mobile Drawer Navigation v5.2
 *
 * FIXES v5.2 (on top of v5.1):
 *   — touchend on overlay: iOS Safari doesn't always fire click on divs.
 *     Adding touchend + e.preventDefault() closes drawer immediately and
 *     prevents the ghost 300ms-delayed click event.
 *   — touchend on close button: same iOS tap reliability fix.
 *   — Both touchend handlers guard with e.target check so a touchstart
 *     that began inside the nav and ended on the overlay still works.
 *
 * v5.1 features retained:
 *   — _dirPending debounce (MutationObserver double-fire guard)
 *   — nav.no-transition freeze during direction change
 *   — double requestAnimationFrame restore
 *   — hijackMenuBtn (removes stale initMobileMenu listener)
 *   — swipe gesture (RTL + LTR aware)
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

  /* ─── Open / Close ─────────────────────────────────────────────── */
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

  /* ─── Overlay ───────────────────────────────────────────────────── */
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(overlay, document.body.firstChild);

    /* click: works on desktop and Android Chrome */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeDrawer();
    });

    /* touchend: iOS Safari reliability fix.
       e.preventDefault() stops the 300ms ghost-click from also firing. */
    overlay.addEventListener('touchend', function(e) {
      if (e.target === overlay) {
        e.preventDefault();
        closeDrawer();
      }
    }, { passive: false });
  }

  /* ─── Close button ──────────────────────────────────────────────── */
  function buildCloseBtn() {
    closeBtn = document.createElement('button');
    closeBtn.id = 'drawerCloseBtn';
    closeBtn.className = 'drawer-close-btn';
    closeBtn.setAttribute('aria-label',
      getDir() === 'ltr' ? 'Close menu'
                         : 'إغلاق القائمة');
    closeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';

    /* click: desktop + Android */
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeDrawer();
    });

    /* touchend: iOS Safari — prevents ghost click + closes immediately */
    closeBtn.addEventListener('touchend', function(e) {
      e.stopPropagation();
      e.preventDefault();
      closeDrawer();
    }, { passive: false });

    nav.insertBefore(closeBtn, nav.firstChild);
  }

  /* ─── Hijack menu button ────────────────────────────────────────── */
  function hijackMenuBtn() {
    var old = document.getElementById('mobileMenuBtn')
           || document.querySelector('.mobile-menu-btn');
    if (!old) return null;
    var fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    fresh.setAttribute('aria-expanded', 'false');
    fresh.setAttribute('aria-controls', 'mainNav');
    fresh.setAttribute('aria-label',    'فتح القائمة');
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

  /* ─── Nav links ─────────────────────────────────────────────────── */
  function bindNavLinks() {
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ─── Swipe gesture ─────────────────────────────────────────────── */
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

  /* ─── Direction change (MutationObserver) ───────────────────────── */
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

  /* ─── Global events ─────────────────────────────────────────────── */
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

  /* ─── Init ──────────────────────────────────────────────────────── */
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
