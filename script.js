// script.js - ملف الجافاسكريبت المحسّن لموقع دورلي v2.0

document.addEventListener('DOMContentLoaded', function () {
  initMobileMenu();
  initScrollEffects();
  initScrollReveal();
  initFAQ();
  initQuickOrder();
  initQuickSearch(); /* <--- ضيف السطر هذا هنا بس */
});

// ==================== 1. القائمة المتنقلة للموبايل (محسّنة) ====================
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn') || document.getElementById('mobileMenuBtn');
  const nav = document.querySelector('nav') || document.getElementById('mainNav');
  if (!mobileMenuBtn || !nav) return;

  // إنشاء طبقة التعتيم
  let overlay = document.getElementById('navOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'navOverlay';
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  function openMenu() {
    nav.classList.add('active');
    overlay.classList.add('active');
    mobileMenuBtn.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) icon.classList.replace('fa-bars', 'fa-times');
  }

  function closeMenu() {
    nav.classList.remove('active');
    overlay.classList.remove('active');
    mobileMenuBtn.classList.remove('is-active');
    document.body.style.overflow = '';
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) icon.classList.replace('fa-times', 'fa-bars');
  }

  mobileMenuBtn.addEventListener('click', () => {
    nav.classList.contains('active') ? closeMenu() : openMenu();
  });

  // إغلاق عند الضغط على الـ overlay
  overlay.addEventListener('click', closeMenu);

  // إغلاق بمفتاح Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      closeMenu();
      mobileMenuBtn.focus();
    }
  });

  // إغلاق عند النقر على رابط في القائمة
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 991) closeMenu();
    });
  });

  // إغلاق عند تكبير الشاشة
  window.addEventListener('resize', () => {
    if (window.innerWidth > 991 && nav.classList.contains('active')) closeMenu();
  });
}

// ==================== 2. تأثيرات التمرير على الهيدر ====================
function initScrollEffects() {
  const header = document.querySelector('header');
  if (!header) return;

  function handleScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// ==================== 3. Scroll Reveal المتقدم ====================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length === 0) return;

  // إذا كان المتصفح يدعم IntersectionObserver
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,
    });

    reveals.forEach(el => observer.observe(el));
  } else {
    // fallback للمتصفحات القديمة
    reveals.forEach(el => el.classList.add('active'));
  }
}

// ==================== 4. الأسئلة الشائعة (FAQ) ====================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        faqItems.forEach(other => {
          if (other !== item) other.classList.remove('active');
        });
        item.classList.toggle('active');
      });
    }
  });
}

// ==================== 5. نموذج الطلب ====================
function initQuickOrder() {
  const form = document.getElementById('orderForm') || document.getElementById('quickOrderForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('.submit-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    const name     = (document.getElementById('name')     || this.querySelector('[name="name"]'))?.value.trim();
    const phone    = (document.getElementById('phone')    || this.querySelector('[name="phone"]'))?.value.trim();
    const city     = (document.getElementById('city')     || this.querySelector('[name="city"]'))?.value || 'غير محدد';
    const category = (document.getElementById('category') || this.querySelector('[name="category"]'))?.value || 'طلب عام';
    const product  = (document.getElementById('product')  || this.querySelector('[name="product"]'))?.value.trim();
    const quantity = document.getElementById('quantity')?.value || '1';
    const urgency  = document.getElementById('urgency')?.value  || 'عادي';

    if (!name || !phone || !product) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة.');
      return;
    }

    const phoneRegex = /^(091|092|094|095)[0-9]{7}$/;
    if (!phoneRegex.test(phone)) {
      alert('الرجاء إدخال رقم هاتف ليبي صحيح (يبدأ بـ 091، 092، 094، أو 095).');
      return;
    }

    if (submitBtn) {
      submitBtn.innerHTML = 'جاري التحويل للواتساب... <i class="fas fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;
    }

    const emo = urgency === 'عاجل' ? '🔴' : urgency === 'متوسط' ? '🟡' : '🟢';
    const msg = `*طلب جديد - دورلي* 📦\n━━━━━━━━━━━━━━━\n👤 *الاسم:* ${name}\n📞 *الهاتف:* ${phone}\n📍 *مدينة التسليم:* ${city}\n🏷️ *نوع الطلب:* ${category}\n🔢 *الكمية:* ${quantity}\n${emo} *الاستعجال:* ${urgency}\n━━━━━━━━━━━━━━━\n📝 *التفاصيل:*\n${product}`;

    const url = `https://wa.me/218946507954?text=${encodeURIComponent(msg)}`;

    // شاشة النجاح إذا كانت موجودة
    const successOverlay = document.getElementById('successOverlay');
    const whatsappLink   = document.getElementById('whatsappLink');
    if (successOverlay && whatsappLink) {
      whatsappLink.href = url;
      successOverlay.classList.add('show');
      setTimeout(() => window.open(url, '_blank'), 1500);
    } else {
      setTimeout(() => {
        window.open(url, '_blank');
        if (submitBtn) {
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
        }
      }, 1000);
    }
  });
}// ... [الأكواد القديمة الموجودة في ملفك] ...
// ... [دوال معالجة كلمات قطع الغيار والواتساب] ...

// -------------------------------------------------
// ميزة البحث السريع في صفحة الخدمات (تمت الإضافة هنا)
const searchInput = document.getElementById('quick-search');
const serviceItems = document.querySelectorAll('.service-item'); 

if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        serviceItems.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            if(itemText.includes(searchTerm)) {
                item.style.display = ''; 
            } else {
                item.style.display = 'none';
            }
        });
    });
}
// ==================== 6. البحث السريع في الخدمات ====================
function initQuickSearch() {
    const searchInput = document.getElementById('quick-search');
    const serviceItems = document.querySelectorAll('.service-item'); 

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            serviceItems.forEach(item => {
                const itemText = item.textContent.toLowerCase();
                if(itemText.includes(searchTerm)) {
                    item.style.display = ''; 
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}


console.log('✅ دورلي v2.0 | script.js جاهز');
