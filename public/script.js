document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
  initMobileMenu();
  initScrollEffects();
  initAnimations();
  initFAQ();
  initQuickOrder();
});

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

function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn') || document.querySelector('.mobile-menu-btn');
  const navLinks = document.getElementById('mainNav');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) icon.classList.replace('fa-bars', 'fa-times');
        else icon.classList.replace('fa-times', 'fa-bars');
      }
    });
  }
}

function initScrollEffects() {
  const header = document.querySelector('header');
  if(header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    });
  }
}

function initAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < window.innerHeight - 100) reveal.classList.add('active');
    });
  };
  window.addEventListener('scroll', revealOnScroll, { passive: true });
  revealOnScroll();
}

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        faqItems.forEach(otherItem => { if (otherItem !== item) otherItem.classList.remove('active'); });
        item.classList.toggle('active');
      });
    }
  });
}

// دالة اطلب على السريع المعدلة (تم تثبيت الرقم مباشرة لضمان العمل)
// تسجّل الطلب في قاعدة البيانات إن كانت مهيأة (window.dawerliDB)، وواتساب يبقى يعمل دائماً.
function initQuickOrder() {
  const form = document.getElementById('quickOrderForm');
  if (form) {
    // أخطاء التحقق التي يجب أن يصلحها المستخدم — أي فشل آخر نتجاهله ونكمل بواتساب
    const USER_FIXABLE = /invalid_phone|invalid_name|missing_fields|rate_limited/;
    const noticeEl = document.getElementById('quickOrderNotice');
    const showNotice = (text) => {
      if (!noticeEl) { alert(text); return; }
      noticeEl.textContent = text;
      noticeEl.hidden = false;
    };
    const hideNotice = () => { if (noticeEl) noticeEl.hidden = true; };

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      hideNotice();

      const submitBtn = this.querySelector('.submit-btn');
      if (submitBtn && submitBtn.disabled) return; // طلب قيد الإرسال
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'إرسال';
      const setBusy = (html) => {
        if (!submitBtn) return;
        submitBtn.innerHTML = html;
        submitBtn.disabled = true;
      };
      const restoreBtn = () => {
        if (submitBtn) { submitBtn.innerHTML = originalBtnText; submitBtn.disabled = false; }
      };
      setBusy('ثواني… قاعدين نحوّلوا فيك للواتساب <i class="fas fa-spinner fa-spin"></i>');

      const nameInput = document.getElementById("name") || this.querySelector('[name="name"]');
      const phoneInput = document.getElementById("phone") || this.querySelector('[name="phone"]');
      const cityInput = document.getElementById("city") || this.querySelector('[name="city"]');
      const categoryInput = document.getElementById("category") || this.querySelector('[name="category"]');
      const productInput = document.getElementById("product") || this.querySelector('[name="product"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const city = cityInput ? cityInput.value.trim() : 'غير محدد';
      const category = categoryInput ? categoryInput.value : 'طلب عام';
      const product = productInput ? productInput.value.trim() : '';

      if(!name || !phone || !product) {
         alert("باقي خانات فاضية (الاسم، الرقم، وتفاصيل الطلب) — عبّيها وابعت.");
         restoreBtn();
         return;
      }

      // ── تسجيل الطلب في قاعدة البيانات (إن كانت مهيأة) ──
      let orderLine = '';
      const dbApi = window.dawerliDB;
      if (dbApi && typeof dbApi.isConfigured === 'function' && dbApi.isConfigured()) {
        setBusy('ثواني… قاعدين نسجّلوا طلبك <i class="fas fa-spinner fa-spin"></i>');
        try {
          const saved = await dbApi.submitOrder({
            name, phone,
            city: city || 'غير محدد',
            category: category || 'طلب عام',
            details: product
          });
          if (saved && saved.code) {
            orderLine = `🔖 رقم الطلب: ${saved.code}\n🔎 تابع طلبك: https://dawerli.org.ly/track/?id=${saved.code}\n`;
          }
        } catch (err) {
          const errText = String((err && err.message) || err || '');
          if (USER_FIXABLE.test(errText)) {
            restoreBtn();
            showNotice(dbApi.friendlyError(err));
            return;
          }
          // فشل شبكة/خادم: نكمل بواتساب بصمت
        }
      }

      // رقم الواتساب المباشر لمنصة دورلي بالصيغة الدولية
      const waNumber = "218946507954";

      let message = `*طلب جديد (${category}) - دورلي*\n\n`;
      message += orderLine;
      message += `👤 الاسم: ${name}\n`;
      message += `📞 رقم الزبون: ${phone}\n`;
      message += `📍 المدينة: ${city}\n`;
      message += `📝 التفاصيل: ${product}`;

      const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

      setTimeout(() => {
        // بعد انتظار القاعدة قد ينتهي "تفعيل المستخدم" فيحجب المتصفح النافذة الجديدة — عندها ننتقل مباشرة
        const win = window.open(whatsappUrl, "_blank");
        if (!win) window.location.href = whatsappUrl;
        restoreBtn();
      }, 800);
    });
  }
}
