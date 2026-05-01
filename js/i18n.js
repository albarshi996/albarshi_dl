(function(){
  const LANG_KEY = 'dawerli_lang';

  // دالة جلب ملف اللغة مع كسر الكاش
  async function loadLangModule(lang){
    try{
      const cacheBuster = '?v=' + new Date().getTime();
      const m = await import(`/lang/${lang}.js${cacheBuster}`);
      return m.default || m;
    } catch (e) {
      console.error('Dawerli i18n Error: Cannot load language file', e);
      return null;
    }
  }

  let currentStrings = {};

  // الدالة الرئيسية لتطبيق الترجمة فوراً
  async function applyLang(lang){
    const data = await loadLangModule(lang);
    if(!data) return;
    
    document.documentElement.lang = lang;
    document.documentElement.dir = data.direction || (lang === 'ar' ? 'rtl' : 'ltr');
    if(data.font) document.documentElement.style.fontFamily = data.font;
    
    // حفظ اللغة في المتصفح بكل الأسماء لضمان التوافق
    localStorage.setItem(LANG_KEY, lang);
    localStorage.setItem('lang', lang);
    currentStrings = data.strings || {};

    // 1. تحديث النصوص المباشرة
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if(key && currentStrings[key]) el.textContent = currentStrings[key];
    });

    // 2. تحديث الحقول (Placeholders)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if(key && currentStrings[key]) el.placeholder = currentStrings[key];
    });

    // 3. تحديث العناوين التوضيحية
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if(key && currentStrings[key]) el.title = currentStrings[key];
    });

    // 4. تحديث قارئ الشاشة
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if(key && currentStrings[key]) el.setAttribute('aria-label', currentStrings[key]);
    });

    // 5. تحديث حرف الزر (ع / EN)
    const langToggle = document.getElementById('langToggleBtn');
    if(langToggle){
      const label = langToggle.querySelector('.lang-label');
      if(label) label.textContent = currentStrings.langLabelShort || (lang === 'ar' ? 'ع' : 'EN');
      langToggle.title = currentStrings.langLabelFull || (lang === 'ar' ? 'العربية' : 'English');
    }

    updateContactLinks();
  }

  // دالة معالجة روابط الواتساب والاتصال
  function updateContactLinks() {
    const phoneLocal = currentStrings.termsWhatsAppNumber || currentStrings.contactPhone || "0946507954";
    let intPhone = null;
    if(phoneLocal) {
       const digits = String(phoneLocal).replace(/\D+/g,'');
       if(digits.length === 10 && digits[0] === '0') intPhone = '218' + digits.substring(1);
       else if(digits.length === 12 && digits.startsWith('218')) intPhone = digits;
       else if(digits.length === 11 && digits.startsWith('0')) intPhone = '218' + digits.substring(1);
       else intPhone = digits;
    }
    const waBase = intPhone ? `https://wa.me/${intPhone}` : null;
    const telUri = phoneLocal ? `tel:${phoneLocal}` : null;

    document.querySelectorAll('a[data-wa]').forEach(a => {
        if(!waBase) return;
        const text = a.getAttribute('data-wa-text');
        a.href = text ? `${waBase}?text=${encodeURIComponent(text)}` : waBase;
    });
    document.querySelectorAll('a[data-tel]').forEach(a => {
        if(telUri) a.href = telUri;
    });
  }

  // دالة التشغيل الآمنة
  async function init() {
    // تشغيل الترجمة المحفوظة فور فتح الصفحة
    const initialLang = localStorage.getItem(LANG_KEY) || 'ar';
    await applyLang(initialLang);

    // حيلة احترافية: نسخ الزر لمسح أمر (التحديث) القديم المرتبط به في script.js
    const oldBtn = document.getElementById('langToggleBtn');
    if(oldBtn) {
       const newBtn = oldBtn.cloneNode(true);
       oldBtn.parentNode.replaceChild(newBtn, oldBtn);
       
       // إضافة أمر التبديل السلس (بدون ريفريش)
       newBtn.addEventListener('click', async (e) => {
         e.preventDefault();
         const current = localStorage.getItem(LANG_KEY) || 'ar';
         const next = current === 'ar' ? 'en' : 'ar';
         await applyLang(next);
       });
    }
  }

  // التأكد من تشغيل السكريبت في كل الظروف (سر المشكلة السابقة)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // التصدير للاستخدام في النماذج
  window.dawerli_i18n = {
    applyLang,
    getString: (key) => currentStrings[key] || null,
    getCurrentLang: () => localStorage.getItem(LANG_KEY) || 'ar',
    getPhoneInfo: () => { return { waBase: `https://wa.me/218946507954` }; }
  };
})();
