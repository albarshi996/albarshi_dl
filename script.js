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

function initQuickOrder() {
  const form = document.getElementById('quickOrderForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = (document.getElementById("name") || this.querySelector('[name="name"]')).value.trim();
      const phone = (document.getElementById("phone") || this.querySelector('[name="phone"]')).value.trim();
      const product = (document.getElementById("product") || this.querySelector('[name="product"]')).value.trim();
      if(!name || !phone || !product) return;
      // رقم التواصل الخاص بمنصة دورلي
      const whatsappUrl = `https://wa.me/218946507954?text=${encodeURIComponent("*طلب جديد*\nالاسم: "+name+"\nالرقم: "+phone+"\nالطلب: "+product)}`;
      window.open(whatsappUrl, "_blank");
    });
  }
}
