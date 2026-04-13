(function() {
// ---- Animated counters ----
function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    if (isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const ease = 1 - Math.pow(2, -10 * progress);
        el.textContent = Math.round(target * ease);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('.count-up');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll(
    '#about_kartel .brand-est, #about_kartel .brand-logo-wrap, #about_kartel .brand-subtitle, ' +
    '#about_kartel .brand-left, #about_kartel .brand-right, ' +
    '#about_kartel .brand-quote, #about_kartel .brand-value-card, ' +
    '#about_kartel .brand-shipyard, #about_kartel .fleet-item, ' +
    '#about_kartel .material-card, #about_kartel .counter-item'
);

revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
});

let stagger = 0;
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            stagger += 60;
            const d = stagger;
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, d);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

revealEls.forEach(el => revealObserver.observe(el));
})();
</script>
(function() {
function animateRGOStat(el) {
    const target = parseInt(el.dataset.target);
    if (isNaN(target)) return;
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(2, -10 * progress);
        el.textContent = Math.round(target * ease);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
    }
    requestAnimationFrame(tick);
}

const rgoStats = document.querySelectorAll('.rgo-stat-value[data-target]');
const rgoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateRGOStat(entry.target);
            rgoObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

rgoStats.forEach(stat => rgoObserver.observe(stat));
})();
</script>
