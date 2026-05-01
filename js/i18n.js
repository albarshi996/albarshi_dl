(function () {
  'use strict';

  var LANG_KEY = 'dawerli_lang';

  function getLangData(lang) {
    if (window.dawerliDict && window.dawerliDict[lang]) {
      return window.dawerliDict[lang];
    }
    console.warn('[dawerli i18n] window.dawerliDict غير موجود.');
    return null;
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

    try {
      document.dispatchEvent(new CustomEvent('dawerli:langChanged', {
        detail: { lang: lang, strings: strings, dir: dir }
      }));
    } catch (e) {}
  }

  function getSavedLang() {
    try { return localStorage.getItem(LANG_KEY) || 'ar'; } catch (e) { return 'ar'; }
  }

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
