// script.js - ملف الجافاسكريبت المحسن لموقع دورلي

document.addEventListener('DOMContentLoaded', function() {
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
  revealOnScroll();
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

// ==================== 6. نموذج الطلب السريع (Quick Order & Request Form) ====================
function initQuickOrder() {
  const form = document.getElementById('orderForm') || document.getElementById('quickOrderForm');
  
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
      const city = cityInput ? cityInput.value.trim() : "غير محدد";
      const category = categoryInput ? categoryInput.value : "طلب عام";
      const product = productInput.value.trim();

      if(!name || !phone || !product) {
          alert("الرجاء تعبئة جميع الحقول المطلوبة.");
          return;
      }

      // التحقق من رقم الهاتف لجميع الشبكات الليبية
      const phoneRegex = /^(091|092|094|095)[0-9]{7}$/;
      if (!phoneRegex.test(phone)) {
          alert("الرجاء إدخال رقم هاتف ليبي صحيح (يبدأ بـ 091, 092, 094, أو 095 ويتكون من 10 أرقام).");
          return;
      }

      // تغيير حالة الزر لمنع التكرار
      submitBtn.innerHTML = 'جاري التحويل للواتساب... <i class="fas fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;

      // تجهيز رسالة الواتساب بناءً على الفئة
      let message = "";
      if (category === "قطع غيار سيارات") {
          message = `*طلب قطع غيار جديد - دورلي*\n\n` +
                    `👤 الاسم: ${name}\n` +
                    `📍 مدينة التسليم: ${city}\n` +
                    `📦 القطعة المطلوبة: ${product}\n` +
                    `🔧 الحالة: (جديد / مستعمل)\n` +
                    `📸 *ملاحظة: يرجى إرفاق صورة للقطعة أو كتيب السيارة في هذه المحادثة.*`;
      } else {
          message = `*طلب جديد (${category}) - دورلي*\n\n` +
                    `👤 الاسم: ${name}\n` +
                    `📍 المدينة: ${city}\n` +
                    `📝 التفاصيل: ${product}`;
      }
        
      const whatsappUrl = `https://wa.me/218946507954?text=${encodeURIComponent(message)}`;
      
      // فتح الواتساب وإعادة الزر لحالته الأصلية بعد ثانية
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      }, 1000);
    });
  }
}
