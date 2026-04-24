// script.js - ملف الجافاسكريبت المحسن لموقع دورلي

document.addEventListener('DOMContentLoaded', function() {
  // ==================== تهيئة جميع المكونات ====================
  initDarkMode();
  initMobileMenu();
  initScrollEffects();
  initAnimations();
  initFAQ();
  initQuickOrder();
});

// ==================== 1. الوضع الليلي (Dark Mode) ====================
function initDarkMode() {
  const toggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');

    // التحقق من الخيار المحفوظ مسبقاً في المتصفح
    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
      if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }

    // الاستماع لحدث النقر على زر الوضع الليلي
    toggleBtn.addEventListener('click', () => {
      body.classList.toggle('dark-mode');
      
      // تغيير الأيقونة وحفظ الإعداد
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
    mobileMenuBtn.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      const icon = this.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) {
          icon.classList.replace('fa-bars', 'fa-times');
        } else {
          icon.classList.replace('fa-times', 'fa-bars');
        }
      }
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

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // تشغيلها مرة عند التحميل
}

// ==================== 5. الأسئلة الشائعة (FAQ) ====================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        // إغلاق جميع الأسئلة الأخرى
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        // تبديل حالة السؤال الحالي
        item.classList.toggle('active');
      });
    }
  });
}

// ==================== 6. نموذج الطلب السريع (Quick Order & Request Form) ====================
function initQuickOrder() {
  // يبحث عن النموذج سواء كان في الصفحة الرئيسية أو صفحة الطلب
  const form = document.getElementById('orderForm') || document.getElementById('quickOrderForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault(); // منع إعادة تحميل الصفحة
      
      // جلب الحقول بأكثر من طريقة لضمان التوافق مع كل صفحاتك
      const nameInput = document.getElementById("name") || this.querySelector('[name="name"]') || this.querySelector('[name="quickName"]');
      const phoneInput = document.getElementById("phone") || this.querySelector('[name="phone"]') || this.querySelector('[name="quickPhone"]');
      const cityInput = document.getElementById("city") || this.querySelector('[name="city"]') || this.querySelector('[name="quickCity"]');
      const productInput = document.getElementById("product") || this.querySelector('[name="product"]') || this.querySelector('[name="quickDetails"]');
      
      if (!nameInput || !phoneInput || !productInput) return;

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const city = cityInput ? cityInput.value.trim() : "غير محدد";
      const product = productInput.value.trim();

      // التحقق 1: الحقول فارغة
      if(!name || !phone || !product) {
          alert("الرجاء تعبئة جميع الحقول المطلوبة.");
          return;
      }

      // التحقق 2: رقم هاتف ليبي (يبدأ بـ 09 وبعده 8 أرقام)
      const phoneRegex = /^09[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
          alert("الرجاء إدخال رقم هاتف صحيح (يبدأ بـ 09 ويتكون من 10 أرقام، مثل: 0918014512).");
          return;
      }

      // تجهيز رسالة الواتساب
      const message =
        "*طلب جديد من دورلي*\n\n" +
        "الاسم: " + name + "\n" +
        "الهاتف: " + phone + "\n" +
        "المدينة: " + city + "\n" +
        "تفاصيل الطلب:\n" + product;
        
      // تحويل المستخدم لواتساب
      const whatsappUrl = `https://wa.me/218918014512?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    });
  }
}
