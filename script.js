// script.js - ملف الجافاسكريبت المحسن لموقع دورلي

document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
  initMobileMenu();
  initScrollEffects();
  initAnimations();
  initFAQ();
  initQuickOrder();
  initLangToggle(); // تمت إضافة استدعاء دالة اللغة هنا
});

// ==================== 1. الوضع الليلي (Dark Mode) ====================
function initDarkMode() {
  const toggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');

    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
      if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }

    toggleBtn.addEventListener('click', () => {
      body.classList.toggle('dark-mode');
      
      if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        if(icon) icon.classList.replace('fa-moon', 'fa-sun');
      } else {
        localStorage.setItem('theme', 'light');
        if(icon) icon.classList.replace('fa-sun', 'fa-moon');
      }
    });
  }
}

// ==================== 2. القائمة المتنقلة للموبايل ====================
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn') || document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links') || document.getElementById('mainNav');
  
  if (mobileMenuBtn && navLinks) {
    // إنشاء overlay
    let overlay = document.getElementById('navOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'navOverlay';
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);
    }

    function openMenu() {
      navLinks.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) icon.classList.replace('fa-bars', 'fa-times');
    }

    function closeMenu() {
      navLinks.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) icon.classList.replace('fa-times', 'fa-bars');
    }

    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.contains('active') ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 991) closeMenu();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 991 && navLinks.classList.contains('active')) closeMenu();
    });
  }
}

// ==================== 3. تأثيرات التمرير (Scroll Effects) ====================
function initScrollEffects() {
  const header = document.querySelector('header') || document.querySelector('nav');
  
  if(header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
  }
}

// ==================== 4. حركات الظهور (Animations) ====================
function initAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;

    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll, { passive: true });
  revealOnScroll();
  setTimeout(revealOnScroll, 200);
}

// ==================== 5. الأسئلة الشائعة (FAQ) ====================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        item.classList.toggle('active');
      });
    }
  });
}

// ==================== 6. نظام الإشعارات المنبثقة (Toast Notifications) ====================
function showCustomToast(message, type = 'error') {
  let toastContainer = document.getElementById('dawerli-toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'dawerli-toast-container';
    toastContainer.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'error' ? '#ef4444' : '#10b981'; 
  const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
  
  toast.style.cssText = `background-color: ${bgColor}; color: white; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: inherit; font-size: 15px; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; direction: ${document.documentElement.dir || 'rtl'};`;
  
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  // حركة الظهور
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // الإخفاء التلقائي بعد 3.5 ثواني
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==================== 7. نموذج الطلب السريع ====================
function initQuickOrder() {
  const form = document.getElementById('quickOrderForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault(); 
      
      const submitBtn = this.querySelector('.submit-btn');
      const originalBtnText = submitBtn.innerHTML;

      const nameInput = document.getElementById("name") || this.querySelector('[name="name"]');
      const phoneInput = document.getElementById("phone") || this.querySelector('[name="phone"]');
      const cityInput = document.getElementById("city") || this.querySelector('[name="city"]');
      const categoryInput = document.getElementById("category") || this.querySelector('[name="category"]');
      const productInput = document.getElementById("product") || this.querySelector('[name="product"]');
      
      if (!nameInput || !phoneInput || !productInput) return;

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const city = cityInput ? cityInput.value.trim() : (window.dawerli_i18n.getString('defaultCityUnknown') || "غير محدد");
      const category = categoryInput ? categoryInput.value : (window.dawerli_i18n.getString('defaultCategoryGeneral') || "طلب عام");
      const product = productInput.value.trim();

        if(!name || !phone || !product) {
          showCustomToast(window.dawerli_i18n.getString('alertFillFields') || "الرجاء تعبئة جميع الحقول المطلوبة.", 'error');
          return;
        }

      // التحقق من رقم الهاتف لجميع الشبكات الليبية
      const phoneRegex = /^09[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
          showCustomToast(window.dawerli_i18n.getString('alertInvalidPhone') || "الرجاء إدخال رقم هاتف ليبي صحيح (10 أرقام يبدأ بـ 09).", 'error');
          return;
        }

      // تغيير حالة الزر لمنع التكرار
      submitBtn.innerHTML = (window.dawerli_i18n.getString('convertingToWhatsapp') || 'جاري التحويل للواتساب...') + ' <i class="fas fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;

      // تجهيز رسالة الواتساب بناءً على الفئة
      let message = "";
        const get = (k) => window.dawerli_i18n.getString(k) || '';
        if (category === (get('catCarParts') || 'قطع غيار السيارات')) {
          message = `${get('whatsapp_car_header') || '*طلب قطع غيار جديد - دورلي*'}\n\n` +
              `${'👤'} ${get('labelName') || 'الاسم'}: ${name}\n` +
              `${'📍'} ${get('labelCity') || 'مدينة التسليم'}: ${city}\n` +
              `${'📦'} ${get('labelProduct') || 'القطعة المطلوبة'}: ${product}\n` +
              `${'🔧'} ${get('whatsapp_state_label') || 'الحالة'}: (جديد / مستعمل)\n` +
              `${'📸'} ${get('whatsapp_attach_note') || '*ملاحظة: يرجى إرفاق صورة للقطعة أو كتيب السيارة في هذه المحادثة.*'}`;
        } else {
          message = `${get('whatsapp_other_header_prefix') || '*طلب جديد*'} (${category}) - دورلي\n\n` +
              `${'👤'} ${get('labelName') || 'الاسم'}: ${name}\n` +
              `${'📍'} ${get('labelCity') || 'المدينة'}: ${city}\n` +
              `${'📝'} ${get('labelDetails') || 'التفاصيل'}: ${product}`;
        }
        
      const base = (window.dawerli_i18n && window.dawerli_i18n.getWhatsAppBase) ? window.dawerli_i18n.getWhatsAppBase() : ((window.dawerli_i18n && window.dawerli_i18n.getPhoneInfo) ? window.dawerli_i18n.getPhoneInfo().waBase : null);
      if(!base){
        showCustomToast(window.dawerli_i18n.getString('alertNoContact') || 'رقم خدمة الواتساب غير مكوّن حالياً. الرجاء المحاولة لاحقاً.', 'error');
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        return;
      }
      const whatsappUrl = `${base}?text=${encodeURIComponent(message)}`;
      
      // فتح الواتساب وإعادة الزر لحالته الأصلية بعد ثانية
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      }, 1000);
    });
  }
}

// ==================== 8. تبديل اللغة (Language Toggle) ====================
function initLangToggle() {
  const langBtn = document.getElementById('langToggleBtn');
  
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      // التحقق من اللغة الحالية
      let currentLang = 'ar';
      
      // إذا كان ملف الترجمة يعمل وموجود، نجلب منه اللغة الحالية
      if (window.dawerli_i18n && typeof window.dawerli_i18n.getCurrentLang === 'function') {
        currentLang = window.dawerli_i18n.getCurrentLang();
      } else {
        // بديل: القراءة من localStorage كخيار احتياطي
        currentLang = localStorage.getItem('dawerli_lang') || 'ar';
      }

      // تحديد اللغة الجديدة
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      
      // حفظ اللغة الجديدة في LocalStorage ليتعرف عليها سكريبت i18n.js
      localStorage.setItem('dawerli_lang', newLang);
      
      // تحديث الصفحة لكي تطبق التغييرات
      window.location.reload();
    });
  }
}
