(function(){
  const LANG_KEY = 'dawerli_lang';
  const defaultLang = localStorage.getItem(LANG_KEY) || 'ar';

  async function loadLangModule(lang){
    try{
      if(lang === 'ar'){
        const m = await import('/lang/ar.js');
        return m.default;
      }
      const m = await import('/lang/en.js');
      return m.default;
    } catch (e) {
      console.error('Failed to load language module', e);
      return null;
    }
  }

  let currentStrings = {};
  async function applyLang(lang){
    const data = await loadLangModule(lang);
    if(!data) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = data.direction || 'ltr';
    document.documentElement.style.fontFamily = data.font || '';
    localStorage.setItem(LANG_KEY, lang);
    currentStrings = data.strings || {};

    // update simple i18n text nodes that use data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if(key && data.strings && data.strings[key]){
        el.textContent = data.strings[key];
      }
    });

    // update placeholders for inputs that use data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if(key && data.strings && data.strings[key]){
        if('placeholder' in el) el.placeholder = data.strings[key];
      }
    });

    // update title attributes for elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if(key && data.strings && data.strings[key]) el.title = data.strings[key];
    });

    // update aria-label for elements with data-i18n-aria
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if(key && data.strings && data.strings[key]) el.setAttribute('aria-label', data.strings[key]);
    });

    // update lang toggle short label
    const langToggle = document.getElementById('langToggleBtn');
    if(langToggle){
      const label = langToggle.querySelector('.lang-label');
      if(label) label.textContent = data.strings.langLabelShort || (lang === 'ar' ? 'ع' : 'EN');
      langToggle.title = data.strings.langLabelFull || (lang === 'ar' ? 'العربية' : 'English');
    }

    // update page meta/title if page id is set on document element
    const pageId = document.documentElement.dataset.page;
    if(pageId){
      const titleKey = `metaTitle_${pageId}`;
      const descKey = `metaDesc_${pageId}`;
      const titleVal = data.strings && data.strings[titleKey];
      const descVal = data.strings && data.strings[descKey];

      if(titleVal){
        const titleEl = document.querySelector('title');
        if(titleEl) titleEl.textContent = titleVal;
        document.title = titleVal;
        const og = document.querySelector('meta[property="og:title"]'); if(og) og.content = titleVal;
        const tw = document.querySelector('meta[name="twitter:title"]'); if(tw) tw.content = titleVal;
      }

      if(descVal){
        const metaDesc = document.querySelector('meta[name="description"]'); if(metaDesc) metaDesc.content = descVal;
        const ogd = document.querySelector('meta[property="og:description"]'); if(ogd) ogd.content = descVal;
        const twd = document.querySelector('meta[name="twitter:description"]'); if(twd) twd.content = descVal;
      }
    }

      // --- Phone / WhatsApp centralization: build links from language file and update DOM ---
      // prefer an explicit key, fallback to commonly used names
      const phoneLocal = currentStrings.termsWhatsAppNumber || currentStrings.contactPhone || currentStrings.contactPhoneNumber || null;
      function toInternational(local){
        if(!local) return null;
        // strip non-digits
        const digits = String(local).replace(/\D+/g,'');
        if(digits.length === 10 && digits[0] === '0') return '218' + digits.substring(1);
        if(digits.length === 12 && digits.startsWith('218')) return digits;
        if(digits.length === 11 && digits.startsWith('0')) return '218' + digits.substring(1);
        return digits;
      }
      const intPhone = toInternational(phoneLocal);
      const waBase = intPhone ? `https://wa.me/${intPhone}` : null;
      const telUri = phoneLocal ? `tel:${phoneLocal}` : null;

      // map data-wa-key or data-wa-text-key -> data-wa-text using current language strings
      document.querySelectorAll('[data-wa-key]').forEach(el => {
        const k = el.getAttribute('data-wa-key');
        if(k && currentStrings[k]) el.setAttribute('data-wa-text', currentStrings[k]);
      });
      document.querySelectorAll('[data-wa-text-key]').forEach(el => {
        const k = el.getAttribute('data-wa-text-key');
        if(k && currentStrings[k]) el.setAttribute('data-wa-text', currentStrings[k]);
      });

      // helper exposed later
      function updateWaAnchors(){
        // anchors explicitly marked with data-wa
        document.querySelectorAll('a[data-wa]').forEach(a => {
            try{
              // if element supplies a data-wa-text attribute, use it as the query text
              const text = a.getAttribute('data-wa-text');
              if(waBase){
                if(text) {
                  a.href = `${waBase}?text=${encodeURIComponent(text)}`;
                } else {
                  const orig = a.getAttribute('data-wa-keep-query') === 'true' ? a.getAttribute('href') || '' : '';
                  // preserve query string if present on the original href
                  let query = '';
                  if(orig && orig.indexOf('?')!==-1) query = orig.substring(orig.indexOf('?'));
                  a.href = waBase + query;
                }
                if(!a.hasAttribute('target')) a.target = '_blank';
                a.rel = 'noopener noreferrer';
              }
            }catch(e){/*ignore*/}
          });

        // anchors with wa.me in href -> normalize but keep query
        document.querySelectorAll('a[href*="wa.me"]').forEach(a=>{
          try{
            const url = new URL(a.href, location.origin);
            const q = url.search || '';
            if(waBase) a.href = waBase + q;
          }catch(e){/*ignore invalid URLs*/}
        });
      }

      function updateTelAnchors(){
        document.querySelectorAll('a[data-tel]').forEach(a => {
          if(telUri) a.href = telUri;
        });
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
          if(telUri) a.href = telUri;
        });
      }

      // update forms that had action to wa.me
      document.querySelectorAll('form[data-wa-form]').forEach(f => {
        try{
          const origAction = f.getAttribute('data-wa-keep-action') === 'true' ? f.getAttribute('action') || '' : '';
          if(waBase) f.action = waBase;
        }catch(e){}
      });

      // update JSON-LD blocks that were marked for dynamic replacement
      document.querySelectorAll('script[type="application/ld+json"][data-i18n-jsonld]').forEach(s => {
        try{
          let txt = s.textContent || '';
          if(waBase) txt = txt.replace(/__WA_ME__/g, waBase);
          if(intPhone) txt = txt.replace(/__INT_PHONE__/g, intPhone);
          if(phoneLocal) txt = txt.replace(/__TEL__/g, phoneLocal).replace(/\+__INT_PHONE__/g, '+'+intPhone);
          s.textContent = txt;
        }catch(e){/*ignore*/}
      });

      updateWaAnchors();
      updateTelAnchors();

  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('langToggleBtn');
    if(btn){
      btn.addEventListener('click', async () => {
        const current = localStorage.getItem(LANG_KEY) || defaultLang;
        const next = current === 'ar' ? 'en' : 'ar';
        await applyLang(next);
      });
    }

    // apply initial language
    applyLang(localStorage.getItem(LANG_KEY) || defaultLang);
  });

  function computePhoneInfo(){
    const phoneLocal = currentStrings.termsWhatsAppNumber || currentStrings.contactPhone || currentStrings.contactPhoneNumber || null;
    const digits = phoneLocal ? String(phoneLocal).replace(/\D+/g,'') : null;
    let intPhone = null;
    if(digits){
      if(digits.length === 10 && digits[0] === '0') intPhone = '218' + digits.substring(1);
      else if(digits.length === 12 && digits.startsWith('218')) intPhone = digits;
      else if(digits.length === 11 && digits.startsWith('0')) intPhone = '218' + digits.substring(1);
      else intPhone = digits;
    }
    return { local: phoneLocal, international: intPhone, waBase: intPhone ? `https://wa.me/${intPhone}` : null, telUri: phoneLocal ? `tel:${phoneLocal}` : null };
  }

  window.dawerli_i18n = {
    applyLang,
    getString: (key) => currentStrings[key] || null,
    _current: () => currentStrings,
    getPhoneInfo: () => computePhoneInfo(),
    getWhatsAppBase: () => { const p = computePhoneInfo(); return p.waBase; },
    getTelUri: () => { const p = computePhoneInfo(); return p.telUri; }
  };
})();
