(function(){
  const LANG_KEY = 'dawerli_lang';

  async function loadLangModule(lang){
    try {
      // المسار الكامل للمجلد في Astro لضمان التحميل
      const m = await import(`/lang/${lang}.js?v=${Date.now()}`);
      return m.default || m;
    } catch (e) {
      console.error('Error loading lang:', e);
      return null;
    }
  }

  async function applyLang(lang){
    const data = await loadLangModule(lang);
    if(!data) return;

    document.documentElement.lang = lang;
    document.documentElement.dir = data.direction || (lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem(LANG_KEY, lang);

    // تحديث كل العناصر التي تحمل data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if(key && data.strings[key]) el.textContent = data.strings[key];
    });

    // تحديث تسمية الزر نفسه
    const label = document.querySelector('.lang-label');
    if(label) label.textContent = lang === 'ar' ? 'ع' : 'EN';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem(LANG_KEY) || 'ar';
    await applyLang(savedLang);

    const btn = document.getElementById('langToggleBtn');
    if(btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const current = localStorage.getItem(LANG_KEY) || 'ar';
        const next = current === 'ar' ? 'en' : 'ar';
        await applyLang(next);
      });
    }
  });
})();
