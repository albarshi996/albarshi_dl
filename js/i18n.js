(function() {
    const LANG_KEY = 'dawerli_lang';

    function toggle() {
        // 1. جلب اللغة الحالية وعكسها
        const current = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ar';
        const next = current === 'ar' ? 'en' : 'ar';
        
        // 2. حفظ اللغة الجديدة
        localStorage.setItem(LANG_KEY, next);
        
        // 3. إعادة تحميل الصفحة (هذه المرة ستعمل لأننا سنغير الرابط قليلاً لكسر الكاش)
        const url = new URL(window.location.href);
        url.searchParams.set('l', next); // إضافة رمز بسيط للرابط لإجبار السيرفر على التحديث
        window.location.href = url.toString();
    }

    // انتظر تحميل الصفحة ثم اربط الزر
    function init() {
        const btn = document.getElementById('langToggleBtn');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                toggle();
            };
        }
        
        // تطبيق اتجاه الصفحة بناءً على اللغة المحفوظة فوراً
        const saved = localStorage.getItem(LANG_KEY) || 'ar';
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = saved;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
