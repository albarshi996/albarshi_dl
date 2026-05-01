(function () {
  'use strict';

  var LANG_KEY = 'dawerli_lang';

  /* ----------------------------------------------------------
   * 1. الحصول على بيانات اللغة من window.dawerliDict
   *    (محقون مباشرة من Astro - لا import() ديناميكي - لا مشاكل MIME)
   * ---------------------------------------------------------- */
  function getLangData(lang) {
    if (window.dawerliDict && window.dawerliDict[lang]) {
      return window.dawerliDict[lang];
    }
    console.warn('[dawerli i18n] window.dawerliDict غير موجود. تأكد من Layout.astro.');
    return null;
  }

  /* ----------------------------------------------------------
   * 2. تطبيق اللغة على الصفحة (بدون reload)
   * ---------------------------------------------------------- */
  function applyLang(lang) {
    var data = getLangData(lang);
    if (!data) return;

    var strings = data.strings || {};
    var dir     = data.direction || (lang === 'ar' ? 'rtl' : 'ltr');
    var font    = data.font || '';

    // اتجاه الصفحة والخط
    document.documentElement.lang = lang;
    document.documentElement.dir  = dir;
    if (font) document.documentElement.style.setProperty('--site-font', font);

    // حفظ الاختيار
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    // ترجمة data-i18n (النص الداخلي)
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && strings[key] !== undefined) el.textContent = strings[key];
    });

    // ترجمة placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key && strings[key] !== undefined) el.placeholder = strings[key];
    });

    // ترجمة title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key && strings[key] !== undefined) el.title = strings[key];
    });

    // ترجمة aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (key && strings[key] !== undefined) el.setAttribute('aria-label', strings[key]);
    });

    // تحديث نص زر اللغة
    var label = document.querySelector('.lang-label');
    if (label) {
      label.textContent = strings.langLabelShort || (lang === 'ar' ? 'ع' : 'EN');
    }

    // إرسال حدث مخصص لتنبيه أي كود آخر في الصفحة
    try {
      document.dispatchEvent(new CustomEvent('dawerli:langChanged', {
        detail: { lang: lang, strings: strings, dir: dir }
      }));
    } catch (e) {}
  }

  /* ----------------------------------------------------------
   * 3. قراءة اللغة المحفوظة
   * ---------------------------------------------------------- */
  function getSavedLang() {
    try { return localStorage.getItem(LANG_KEY) || 'ar'; } catch (e) { return 'ar'; }
  }

  /* ----------------------------------------------------------
   * 4. تهيئة النظام
   * ---------------------------------------------------------- */
  function init() {
    applyLang(getSavedLang());

    var btn = document.getElementById('langToggleBtn');
    if (btn) {
      // نسخ الزر لإزالة أي event listeners قديمة
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
