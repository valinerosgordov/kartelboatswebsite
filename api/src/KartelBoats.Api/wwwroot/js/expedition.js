(function(){
const container = document.querySelector('.expedition-preview');
if (!container) return;
const slides = container.querySelectorAll('.expedition-slide');
const counterEl = container.querySelector('.exp-current');
const totalEl = container.querySelector('.exp-total');
if (!slides.length) return;

let current = 0;
let autoTimer;
const AUTO_INTERVAL = 5000;

if (totalEl) totalEl.textContent = slides.length;

// Build progress dots
const dotsContainer = container.querySelector('.expedition-dots');
const dots = [];
if (dotsContainer) {
for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement('span');
    dot.className = 'expedition-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        show(i);
        startAuto();
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
}
}

function updateDots() {
dots.forEach(function(d, i) {
    d.classList.toggle('active', i === current);
});
}

function show(idx) {
slides[current].classList.remove('active');
current = (idx + slides.length) % slides.length;
slides[current].classList.add('active');
if (counterEl) counterEl.textContent = current + 1;
updateDots();
}

// Init first slide
slides[0].classList.add('active');

function startAuto() {
clearInterval(autoTimer);
autoTimer = setInterval(function(){ show(current + 1); }, AUTO_INTERVAL);
}

// Arrows
container.querySelectorAll('.expedition-arrow').forEach(function(arrow){
arrow.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    var dir = parseInt(this.dataset.dir);
    show(current + dir);
    startAuto(); // reset timer
});
});

startAuto();
})();
</script>
