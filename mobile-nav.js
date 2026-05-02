/**
 * mobile-nav.js — Dawerli Mobile Drawer Navigation v5.0
 *
 * Features:
 *   ✅ Overlay (tap to close)
 *   ✅ Swipe-to-close gesture (touch)
 *   ✅ RTL: drawer slides from RIGHT (Arabic)
 *   ✅ LTR: drawer slides from LEFT (English) — reads html[dir]
 *   ✅ Body scroll lock while drawer is open
 *   ✅ Escape key closes drawer
 *   ✅ Resize to desktop auto-closes
 *   ✅ MutationObserver on html[dir] for lang toggle
 *   ✅ Does NOT conflict with i18n.js or Header.astro inline script
 *   ✅ Hijacks #mobileMenuBtn to remove stale initMobileMenu() listener
 *
 * Served at: /mobile-nav.js (root → cp *.js public/ in deploy.yml)
 * Load order: after /script.js, before /js/i18n.js
 */
(function () {
  'use strict';

  var overlay      = null;
  var nav          = null;
  var menuBtn      = null;
  var closeBtn     = null;
  var isOpen       = false;
  var touchStartX  = 0;
  var touchStartY  = 0;
  var SWIPE_THRESHOLD = 55; // px

  /* ── Direction helper ─────────────────────────────────────────────── */
  function getDir() {
    return document.documentElement.dir === 'ltr' ? 'ltr' : 'rtl';
  }

  /* ── Icon helper ──────────────────────────────────────────────────── */
  function setIcon(open) {
    if (!menuBtn) return;
    var icon = menuBtn.querySelector('i');
    if (!icon) return;
    icon.classList.remove(open ? 'fa-bars' : 'fa-times');
    icon.classList.add(open   ? 'fa-times' : 'fa-bars');
  }

  /* ── Open ─────────────────────────────────────────────────────────── */
  function openDrawer() {
    if (isOpen) return;
    isOpen = true;
    nav.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('drawer-open');
    setIcon(true);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    nav.setAttribute('aria-hidden', 'false');
  }

  /* ── Close ────────────────────────────────────────────────────────── */
  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;
    nav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('drawer-open');
    setIcon(false);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');
  }

  /* ── Build overlay ────────────────────────────────────────────────── */
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    /* Insert at top of body so stacking context is correct */
    document.body.insertBefore(overlay, document.body.firstChild);
    overlay.addEventListener('click', closeDrawer);
  }

  /* ── Build close button inside drawer ────────────────────────────── */
  function buildCloseBtn() {
    closeBtn = document.createElement('button');
    closeBtn.id = 'drawerCloseBtn';
    closeBtn.className = 'drawer-close-btn';
    closeBtn.setAttribute('aria-label',
      getDir() === 'ltr' ? 'Close menu' : 'إغلاق القائمة');
    closeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeDrawer();
    });
    nav.insertBefore(closeBtn, nav.firstChild);
  }

  /* ── Hijack menu button ───────────────────────────────────────────────
     Cloning removes all event listeners set by initMobileMenu() in
     script.js, preventing double-toggle conflicts.                     */
  function hijackMenuBtn() {
    var old = document.getElementById('mobileMenuBtn')
           || document.querySelector('.mobile-menu-btn');
    if (!old) return null;
    var fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    fresh.setAttribute('aria-expanded',  'false');
    fresh.setAttribute('aria-controls',  'mainNav');
    fresh.setAttribute('aria-label',     'فتح القائمة');
    fresh.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeDrawer() : openDrawer();
    });
    return fresh;
  }

  /* ── Close on nav link click ──────────────────────────────────────── */
  function bindNavLinks() {
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ── Swipe gesture ────────────────────────────────────────────────── */
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (!isOpen) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < Math.abs(dy)) return; // vertical scroll — ignore
    var dir = getDir();
    /* RTL drawer is on the right: swipe LEFT to close */
    if (dir === 'rtl' && dx < -SWIPE_THRESHOLD) { closeDrawer(); return; }
    /* LTR drawer is on the left: swipe RIGHT to close */
    if (dir === 'ltr' && dx >  SWIPE_THRESHOLD) { closeDrawer(); return; }
  }

  /* ── Direction change observer (MutationObserver on html[dir]) ───────
     Header.astro's applyHeaderLang() sets document.documentElement.dir
     directly. We watch it to close the drawer and update the close     
     button label on language toggle.                                   */
  function observeDirection() {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName !== 'dir' && m.attributeName !== 'lang') return;
        if (isOpen) closeDrawer();
        if (closeBtn) {
          closeBtn.setAttribute('aria-label',
            getDir() === 'ltr' ? 'Close menu'
                               : 'إغلاق القائمة');
        }
      });
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'lang']
    });
  }

  /* ── Global bindings ──────────────────────────────────────────────── */
  function bindGlobal() {
    /* Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    });
    /* Resize to desktop */
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992 && isOpen) closeDrawer();
    }, { passive: true });
    /* dawerli:langChanged (fired by js/i18n.js if/when it loads) */
    document.addEventListener('dawerli:langChanged', function () {
      if (isOpen) closeDrawer();
    });
  }

  /* ── Init ─────────────────────────────────────────────────────────── */
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
    nav.setAttribute('aria-hidden', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
