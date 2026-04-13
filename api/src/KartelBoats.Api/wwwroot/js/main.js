// ===== PRELOADER =====
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    const progress = document.getElementById('preloader-progress');
    const percent = document.getElementById('preloader-percent');

    let currentProgress = 0;
    const targetProgress = 100;
    const duration = 2000;
    const interval = 20;
    const increment = (targetProgress / duration) * interval;

    const progressInterval = setInterval(function() {
        currentProgress += increment;

        if (currentProgress >= targetProgress) {
            currentProgress = targetProgress;
            clearInterval(progressInterval);
            setTimeout(function() {
                preloader.classList.add('hidden');
            }, 300);
        }

        progress.style.width = currentProgress + '%';
        percent.textContent = 'ЗАГРУЗКА ' + Math.floor(currentProgress) + '%';
    }, interval);
});

// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('main-header');
window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===== UNIVERSAL SCROLL REVEAL =====
(function() {
    const scrollEls = document.querySelectorAll('.scroll-reveal');
    scrollEls.forEach(function(el) {
        if (el.closest('#about_kartel')) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    });

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    scrollEls.forEach(function(el) {
        if (!el.closest('#about_kartel')) observer.observe(el);
    });
})();

// ===== MODAL HASH HANDLER =====
window.addEventListener('hashchange', function() {
    var hash = location.hash;
    if (!hash) return;
    var modal = document.querySelector(hash);
    if (!modal || !modal.classList.contains('modal') || modal.classList.contains('modal--media')) return;
    var dialog = modal.querySelector('.modal__dialog');
    if (dialog) dialog.scrollTop = 0;
    var specItems = modal.querySelectorAll('.spec-list li');
    specItems.forEach(function(li) {
        li.style.animation = 'none';
        li.offsetHeight;
        li.style.animation = '';
    });
});
