(function () {
  'use strict';

  var LANG_KEY = 'dawerli_lang';
  var WA_PHONE = '218946507954';
  var WA_BASE  = 'https://wa.me/' + WA_PHONE;
  var TEL_HREF = 'tel:+' + WA_PHONE;

  function getLangData(lang) {
    if (window.dawerliDict && window.dawerliDict[lang]) {
      return window.dawerliDict[lang];
    }
    console.warn('[dawerli i18n] window.dawerliDict غير موجود.');
    return null;
  }

  function initWhatsAppLinks(strings) {
    document.querySelectorAll('[data-wa]').forEach(function (el) {
      var key = el.getAttribute('data-wa-key');
      if (key && strings && strings[key]) {
        el.href = WA_BASE + '?text=' + encodeURIComponent(strings[key]);
      } else {
        el.href = WA_BASE;
      }
      el.target  = '_blank';
      el.rel     = 'noopener noreferrer';
    });

    document.querySelectorAll('[data-tel]').forEach(function (el) {
      el.href = TEL_HREF;
    });
  }

  function applyLang(lang) {
    var data = getLangData(lang);
    if (!data) return;

    var strings = data.strings || {};
    var dir     = data.direction || (lang === 'ar' ? 'rtl' : 'ltr');
    var font    = data.font || '';

    document.documentElement.lang = lang;
    document.documentElement.dir  = dir;
    if (font) document.documentElement.style.fontFamily = font;

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && strings[key] !== undefined) el.textContent = strings[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key && strings[key] !== undefined) el.placeholder = strings[key];
    });

    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key && strings[key] !== undefined) el.title = strings[key];
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (key && strings[key] !== undefined) el.setAttribute('aria-label', strings[key]);
    });

    var label = document.querySelector('.lang-label');
    if (label) {
      label.textContent = strings.langLabelShort || (lang === 'ar' ? 'ع' : 'EN');
    }

    initWhatsAppLinks(strings);

    try {
      document.dispatchEvent(new CustomEvent('dawerli:langChanged', {
        detail: { lang: lang, strings: strings, dir: dir }
      }));
    } catch (e) {}
  }

  function getSavedLang() {
    try { return localStorage.getItem(LANG_KEY) || 'ar'; } catch (e) { return 'ar'; }
  }

  function getCurrentStrings() {
    var lang = getSavedLang();
    var data = getLangData(lang);
    return (data && data.strings) ? data.strings : {};
  }

  function getString(key) {
    var s = getCurrentStrings();
    return (s && s[key] !== undefined) ? s[key] : '';
  }

  window.dawerli_i18n = {
    getString: getString,
    getWhatsAppBase: function () { return WA_BASE; },
    getPhoneInfo: function () {
      return { waBase: WA_BASE, tel: TEL_HREF, intl: '+' + WA_PHONE };
    },
    getLang: getSavedLang
  };

  function init() {
    applyLang(getSavedLang());

    var btn = document.getElementById('langToggleBtn');
    if (btn) {
      var freshBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(freshBtn, btn);

      freshBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var current = getSavedLang();
        applyLang(current === 'ar' ? 'en' : 'ar');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
