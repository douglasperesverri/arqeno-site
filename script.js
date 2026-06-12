/* arqeno landing — signup + interações. Sem dependências. */
(function () {
    'use strict';

    // Base da API de aquisição (Laravel, domínio central).
    // Em dev local: troque para http://localhost:8000 e sirva a landing em :8080.
    var API_BASE = 'https://api.arqeno.cloud';

    /* ── Reveal on scroll ─────────────────────────────────── */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ── Entrar: pede o subdominio do escritorio ──────────── */
    var navLogin = document.getElementById('nav-login');
    if (navLogin) {
        navLogin.addEventListener('click', function (ev) {
            ev.preventDefault();
            var sub = window.prompt('Qual o endereço do seu escritório?\n(ex.: "seuescritorio" de seuescritorio.arqeno.cloud)');
            if (sub) {
                sub = sub.toLowerCase().replace(/[^a-z0-9-]/g, '');
                if (sub) window.location.href = 'https://' + sub + '.arqeno.cloud/app';
            }
        });
    }

    /* ── Modal ────────────────────────────────────────────── */
    var overlay = document.getElementById('signup-overlay');
    var planSelect = document.getElementById('f-plan');
    var firstField = document.getElementById('f-office');

    function openModal(plan) {
        if (plan && planSelect.querySelector('option[value="' + plan + '"]')) {
            planSelect.value = plan;
        }
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(function () { firstField.focus(); }, 120);
    }

    function closeModal() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-open-signup]').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            openModal(btn.getAttribute('data-plan'));
        });
    });
    document.querySelectorAll('[data-close-signup]').forEach(function (btn) {
        btn.addEventListener('click', closeModal);
    });
    overlay.addEventListener('click', function (ev) {
        if (ev.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    /* ── Subdomínio: slugify + verificação em tempo real ──── */
    var subInput = document.getElementById('f-subdomain');
    var subHint = document.getElementById('subdomain-hint');
    var officeInput = document.getElementById('f-office');
    var subTouched = false;
    var checkTimer = null;

    function slugify(value) {
        return value
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40);
    }

    // Sugere o subdomínio a partir do nome do escritório (até o usuário mexer).
    officeInput.addEventListener('input', function () {
        if (!subTouched) {
            subInput.value = slugify(officeInput.value);
            scheduleCheck();
        }
    });
    subInput.addEventListener('input', function () {
        subTouched = true;
        var cleaned = slugify(subInput.value);
        if (cleaned !== subInput.value) subInput.value = cleaned;
        scheduleCheck();
    });

    function scheduleCheck() {
        clearTimeout(checkTimer);
        var value = subInput.value;
        if (value.length < 3) {
            setHint('Letras minúsculas, números e hífen (mín. 3).', '');
            return;
        }
        setHint('Verificando disponibilidade…', '');
        checkTimer = setTimeout(function () {
            fetch(API_BASE + '/api/signup/check-subdomain?subdomain=' + encodeURIComponent(value))
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (subInput.value !== value) return; // mudou enquanto checava
                    if (data.available) {
                        setHint('✓ ' + value + '.arqeno.cloud está disponível', 'ok');
                    } else {
                        setHint('✗ Este endereço não está disponível. Tente outro.', 'err');
                    }
                })
                .catch(function () { setHint('', ''); });
        }, 450);
    }

    function setHint(text, cls) {
        subHint.textContent = text;
        subHint.className = 'field-hint' + (cls ? ' ' + cls : '');
    }

    /* ── Submit ───────────────────────────────────────────── */
    var form = document.getElementById('signup-form');
    var submitBtn = document.getElementById('signup-submit');
    var errorBox = document.getElementById('signup-error');

    form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        errorBox.classList.remove('show');

        if (!form.reportValidity()) return;

        var payload = {
            office_name: form.office_name.value.trim(),
            contact_name: form.contact_name.value.trim(),
            email: form.email.value.trim(),
            password: form.password.value,
            subdomain: form.subdomain.value.trim(),
            plan: form.plan.value,
            website: form.website.value // honeypot
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Criando…';

        fetch(API_BASE + '/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
            .then(function (res) {
                if (res.ok) {
                    document.getElementById('signup-form-wrap').style.display = 'none';
                    document.getElementById('success-email').textContent = payload.email;
                    document.getElementById('signup-success').classList.add('show');
                    return;
                }
                var msg = res.data && res.data.message ? res.data.message : 'Não foi possível concluir. Revise os campos e tente de novo.';
                if (res.data && res.data.errors) {
                    var first = Object.keys(res.data.errors)[0];
                    if (first && res.data.errors[first][0]) msg = res.data.errors[first][0];
                }
                showError(msg);
            })
            .catch(function () {
                showError('Falha de conexão. Verifique sua internet e tente novamente.');
            })
            .finally(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar ambiente grátis →';
            });
    });

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.add('show');
        errorBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
})();
