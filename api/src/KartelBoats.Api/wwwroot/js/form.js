(function(){
const form = document.getElementById('kb-testdrive-form');
if (!form) return;

const phone = document.getElementById('kb_phone');
const nameF = document.getElementById('kb_name');
const email = document.getElementById('kb_email');
const city  = document.getElementById('kb_city');
const model = document.getElementById('kb_model');
const btn   = form.querySelector('.kb-submit-btn');
const btnText   = form.querySelector('.kb-btn-text');
const btnLoader = form.querySelector('.kb-btn-loader');
const statusOk  = form.querySelector('.kb-status--success');
const statusErr = form.querySelector('.kb-status--error');
const errMsg    = form.querySelector('.kb-error-msg');

/* ---- Phone mask +7 XXX XXX-XX-XX ---- */
phone.addEventListener('input', function(){
let d = this.value.replace(/\D/g,'');
if (d.length === 0) { this.value = ''; return; }
if (d[0] === '8') d = '7' + d.slice(1);
if (d[0] !== '7') d = '7' + d;
d = d.slice(0, 11);
let out = '+7';
if (d.length > 1) out += ' ' + d.slice(1, 4);
if (d.length > 4) out += ' ' + d.slice(4, 7);
if (d.length > 7) out += '-' + d.slice(7, 9);
if (d.length > 9) out += '-' + d.slice(9, 11);
this.value = out;
});
phone.addEventListener('focus', function(){
if (!this.value) this.value = '+7';
});
phone.addEventListener('blur', function(){
if (this.value === '+7') this.value = '';
});

/* ---- Real-time validation ---- */
function validate(el){
let ok = false;
if (el === phone) {
    ok = el.value.replace(/\D/g,'').length === 11;
} else if (el === email) {
    ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
} else if (el.tagName === 'SELECT') {
    ok = el.value !== '';
} else {
    ok = el.value.trim().length >= 2;
}
el.classList.toggle('kb-valid', ok);
el.classList.toggle('kb-invalid', !ok && el.value.length > 0);
return ok;
}

[nameF, phone, email, city, model].forEach(function(el){
el.addEventListener('input', function(){ validate(el); });
el.addEventListener('change', function(){ validate(el); });
});

/* ---- Submit ---- */
form.addEventListener('submit', function(e){
e.preventDefault();

// Validate all
let allOk = true;
[nameF, phone, email, city, model].forEach(function(el){
    if (!validate(el)) allOk = false;
});
if (!allOk) return;

// Get contact method
const contactEl = form.querySelector('input[name="contact_method"]:checked');
const contact = contactEl ? contactEl.value : 'Звонок';

// UI: loading
btn.disabled = true;
btnText.style.display = 'none';
btnLoader.style.display = 'inline-flex';
statusOk.style.display = 'none';
statusErr.style.display = 'none';

const workerUrl = form.dataset.workerUrl;
const payload = {
    name:  nameF.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    city:  city.value,
    model: model.value,
    contact_method: contact
};

fetch(workerUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
})
.then(function(r){
    if (!r.ok) throw new Error(r.status);
    return r.json();
})
.then(function(){
    statusOk.style.display = 'flex';
    form.querySelector('.kb-grid').style.display = 'none';
    form.querySelector('.kb-actions').style.display = 'none';
    form.querySelector('.kb-note').style.display = 'none';

    // Auto-close modal after 3s
    setTimeout(function(){
        var modal = form.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        // Reset form for next use
        form.reset();
        form.querySelector('.kb-grid').style.display = '';
        form.querySelector('.kb-actions').style.display = '';
        form.querySelector('.kb-note').style.display = '';
        statusOk.style.display = 'none';
        btn.disabled = false;
        btnText.style.display = '';
        btnLoader.style.display = 'none';
        [nameF, phone, email, city, model].forEach(function(el){
            el.classList.remove('kb-valid','kb-invalid');
        });
    }, 3000);
})
.catch(function(err){
    statusErr.style.display = 'flex';
    if (errMsg) errMsg.textContent = 'Ошибка ' + (err.message || '') + '. Попробуйте снова.';
    btn.disabled = false;
    btnText.style.display = '';
    btnLoader.style.display = 'none';
});
});
})();
</script>
