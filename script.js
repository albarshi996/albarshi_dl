// script.js - ملف الجافاسكريبت المحسن لموقع دورلي

document.addEventListener('DOMContentLoaded', function() {
  // ==================== تهيئة جميع المكونات ====================
  initMobileMenu();
  initScrollEffects();
  initAnimations();
  initForms();
  initFAQ();
  initScrollToTop();
});

// ==================== القائمة المتنقلة للموبايل ====================
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      const icon = this.querySelector('i');
      if (mainNav.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
    
    // إغلاق القائمة عند النقر على رابط
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        mobileMenuBtn.querySelector('i').classList.remove('fa-times');
        mobileMenuBtn.querySelector('i').classList.add('fa-bars');
      });
    });
  }
}

// ==================== تأثيرات التمرير ====================
function initScrollEffects() {
  // تأثير التمرير على الهيدر
  const header = document.querySelector('header');
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // تأثير الظهور عند التمرير
  const revealElements = document.querySelectorAll('.reveal');
  
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(element => {
      observer.observe(element);
    });
  }
}

// ==================== الحركات والتأثيرات ====================
function initAnimations() {
  // إضافة تأثيرات للبطاقات عند التمرير
  const animatedCards = document.querySelectorAll('.feature-card, .stat-card, .step-content');
  
  if (animatedCards.length > 0) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1
    });
    
    animatedCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      cardObserver.observe(card);
    });
  }
}

// ==================== نماذج التواصل ====================
function initForms() {
  // نموذج الطلب
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع بيانات النموذج
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // إنشاء رسالة واتساب
      const whatsappMessage = `طلب جديد من دورلي:%0A%0A` +
        `الاسم: ${data.name}%0A` +
        `الهاتف: ${data.phone}%0A` +
        `المدينة: ${data.city}%0A` +
        `فئة المنتج: ${data.category}%0A` +
        `تفاصيل المنتج: ${data.product}%0A` +
        `الميزانية: ${data.budget || 'غير محدد'}%0A` +
        `ملاحظات: ${data.notes || 'لا يوجد'}`;
      
      // فتح واتساب
      window.open(`https://wa.me/218946507954?text=${whatsappMessage}`, '_blank');
      
      // إظهار رسالة نجاح
      showNotification('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.', 'success');
      
      // إعادة تعيين النموذج
      this.reset();
    });
  }
  
  // نموذج التواصل
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع بيانات النموذج
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // إنشاء رسالة واتساب
      const whatsappMessage = `رسالة تواصل جديدة من دورلي:%0A%0A` +
        `الاسم: ${data.contactName}%0A` +
        `البريد الإلكتروني: ${data.contactEmail}%0A` +
        `الهاتف: ${data.contactPhone}%0A` +
        `الموضوع: ${data.contactSubject}%0A` +
        `الرسالة: ${data.contactMessage}`;
      
      // فتح واتساب
      window.open(`https://wa.me/218946507954?text=${whatsappMessage}`, '_blank');
      
      // إظهار رسالة نجاح
      showNotification('تم إرسال رسالتك بنجاح! سنرد عليك في أقرب وقت.', 'success');
      
      // إعادة تعيين النموذج
      this.reset();
    });
  }
}

// ==================== الأسئلة الشائعة ====================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // إغلاق جميع العناصر الأخرى
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // فتح/إغلاق العنصر الحالي
      item.classList.toggle('active');
    });
  });
}

// ==================== زر العودة للأعلى ====================
function initScrollToTop() {
  // إنشاء زر العودة للأعلى
  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  scrollToTopBtn.className = 'scroll-to-top';
  scrollToTopBtn.setAttribute('aria-label', 'العودة إلى الأعلى');
  document.body.appendChild(scrollToTopBtn);
  
  // إضافة الأنماط
  const style = document.createElement('style');
  style.textContent = `
    .scroll-to-top {
      position: fixed;
      bottom: 30px;
      left: 30px;
      width: 50px;
      height: 50px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: var(--shadow-lg);
      transition: var(--transition);
      opacity: 0;
      visibility: hidden;
      z-index: 1000;
    }
    
    .scroll-to-top.visible {
      opacity: 1;
      visibility: visible;
    }
    
    .scroll-to-top:hover {
      background: var(--primary-dark);
      transform: translateY(-3px);
      box-shadow: var(--shadow-xl);
    }
    
    @media (max-width: 768px) {
      .scroll-to-top {
        bottom: 20px;
        left: 20px;
        width: 45px;
        height: 45px;
      }
    }
  `;
  document.head.appendChild(style);
  
  // التحكم في ظهور الزر
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });
  
  // حدث النقر
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ==================== وظائف مساعدة ====================
function showNotification(message, type = 'info') {
  // إنشاء عنصر الإشعار
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // إضافة الأنماط
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 100px;
      right: 30px;
      padding: 1rem 1.5rem;
      border-radius: var(--border-radius);
      color: white;
      font-weight: 600;
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      max-width: 400px;
    }
    
    .notification.success {
      background: var(--secondary);
    }
    
    .notification.error {
      background: #ef4444;
    }
    
    .notification.info {
      background: var(--primary);
    }
    
    .notification.show {
      transform: translateX(0);
    }
    
    @media (max-width: 768px) {
      .notification {
        right: 15px;
        left: 15px;
        max-width: none;
        transform: translateY(-100px);
      }
      
      .notification.show {
        transform: translateY(0);
      }
    }
  `;
  
  if (!document.querySelector('#notification-styles')) {
    style.id = 'notification-styles';
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // إظهار الإشعار
  setTimeout(() => notification.classList.add('show'), 100);
  
  // إخفاء الإشعار بعد 5 ثواني
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

// ==================== تحميل الصفحة ====================
window.addEventListener('load', function() {
  // إخفاء شاشة التحميل إذا كانت موجودة
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
  
  // تحسين أداء الصور
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.loading = 'lazy';
  });
});

// ==================== تحسينات SEO ====================
// تتبع الأحداث الهامة
function trackEvent(category, action, label) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      'event_category': category,
      'event_label': label
    });
  }
}

// تتبع النقر على الروابط الهامة
document.addEventListener('DOMContentLoaded', function() {
  const trackableLinks = document.querySelectorAll('a[href^="https://wa.me"], a[href^="tel:"], a[href^="mailto:"]');
  
  trackableLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      let action = 'click';
      let label = href;
      
      if (href.includes('wa.me')) {
        action = 'whatsapp_click';
        label = 'whatsapp_contact';
      } else if (href.includes('tel:')) {
        action = 'phone_click';
        label = 'phone_contact';
      } else if (href.includes('mailto:')) {
        action = 'email_click';
        label = 'email_contact';
      }
      
      trackEvent('Contact', action, label);
    });
  });
});
