// ============================================================
//  HUGO BARÈS — Portfolio
//  Navigation · révélation au scroll · aperçus · lightbox
// ============================================================

// ---------- Navigation ----------
const initNav = () => {
    const nav = document.getElementById('nav');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.getElementById('navLinks');

    if (toggle && links) {
        const closeMenu = () => {
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        };
        toggle.addEventListener('click', () => {
            const open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    }

    if (nav) {
        const onScroll = () => nav.classList.toggle('nav--scrolled', (window.scrollY || 0) > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
};

// ---------- Révélation au scroll (opacité seule, sans transform) ----------
const initReveal = () => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
        els.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    els.forEach(el => io.observe(el));
};

// ---------- Aperçus avant / après (défilement au survol, vitesse constante) ----------
const initSitePreviews = () => {
    const SPEED = 130;   // pixels par seconde (plus petit = plus lent)
    const MIN = 3;       // durée minimale (s)
    const MAX = 16;      // durée maximale (s)

    const previews = document.querySelectorAll('.site-preview .preview-frame');
    if (!previews.length) return;

    const setDuration = (frame) => {
        const img = frame.querySelector('img');
        if (!img || !img.naturalWidth) return;
        const displayedHeight = frame.clientWidth * (img.naturalHeight / img.naturalWidth);
        const overflow = Math.max(0, displayedHeight - frame.clientHeight);
        const duration = Math.min(MAX, Math.max(MIN, overflow / SPEED));
        img.style.transitionDuration = `${duration.toFixed(1)}s`;
    };

    const applyAll = () => previews.forEach((frame) => {
        const img = frame.querySelector('img');
        if (img.complete && img.naturalWidth) setDuration(frame);
        else img.addEventListener('load', () => setDuration(frame), { once: true });
    });

    applyAll();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyAll, 200);
    }, { passive: true });
};

// ---------- Lightbox (créations graphiques) ----------
const initLightbox = () => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const img = lightbox.querySelector('.lightbox-img');
    const btnClose = lightbox.querySelector('.lightbox-close');
    const btnPrev = lightbox.querySelector('.lightbox-prev');
    const btnNext = lightbox.querySelector('.lightbox-next');
    const thumbs = Array.from(document.querySelectorAll('.crea-thumb'));
    if (!thumbs.length) return;

    let current = 0;
    let lastFocused = null;

    const show = (index) => {
        current = (index + thumbs.length) % thumbs.length;
        const thumb = thumbs[current];
        img.src = thumb.dataset.full;
        img.alt = thumb.querySelector('img')?.alt || '';
    };

    const open = (index) => {
        lastFocused = document.activeElement;
        show(index);
        lightbox.hidden = false;
        document.body.classList.add('lb-open');
        requestAnimationFrame(() => lightbox.classList.add('is-open'));
        btnClose.focus();
    };

    const close = () => {
        lightbox.classList.remove('is-open');
        document.body.classList.remove('lb-open');
        const done = () => {
            lightbox.hidden = true;
            img.src = '';
            lightbox.removeEventListener('transitionend', done);
        };
        lightbox.addEventListener('transitionend', done);
        if (lastFocused) lastFocused.focus();
    };

    thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => open(index)));
    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => show(current - 1));
    btnNext.addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) close(); });
    document.addEventListener('keydown', (event) => {
        if (lightbox.hidden) return;
        if (event.key === 'Escape') close();
        else if (event.key === 'ArrowLeft') show(current - 1);
        else if (event.key === 'ArrowRight') show(current + 1);
        else if (event.key === 'Tab') {
            // Piège le focus dans la modale
            const f = [btnClose, btnPrev, btnNext].filter(b => b && b.offsetParent !== null);
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            else if (!f.includes(document.activeElement)) { event.preventDefault(); first.focus(); }
        }
    });
};




// ---------- Timeline Réalisations (barre de progression au scroll) ----------
const initRealisationTimeline = () => {
    const tl = document.querySelector('.rtl');
    if (!tl) return;
    const prog = tl.querySelector('.rtl-progress');
    if (!prog) return;
    const clampv = (n, a, b) => Math.min(b, Math.max(a, n));
    let ticking = false;
    const update = () => {
        ticking = false;
        const rect = tl.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const denom = (rect.height - vh * 0.4) || 1;
        const p = clampv((vh * 0.1 - rect.top) / denom, 0, 1);
        prog.style.height = (p * rect.height) + 'px';
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
};

// ---------- Parcours : meuble 3D (tiroirs + panneau) ----------
const initCabinet = () => {
    const cab = document.getElementById('parcoursCabinet');
    if (!cab) return;
    const panel = document.getElementById('cabPanel');
    const drawers = Array.from(cab.querySelectorAll('.cab-drawer'));
    if (!drawers.length || !panel) return;
    const DATA = [
        { date: 'Depuis mars 2025', tag: 'En poste', role: 'Chef de projet web/marketing', company: 'Groupe Baho \u00b7 Les Alluets-le-Roi', items: [
            'Refonte compl\u00e8te de billat.com (design, performance, SEO, s\u00e9curit\u00e9) + back-office sur mesure',
            'Pilotage du r\u00e9f\u00e9rencement naturel et de 35 campagnes emailing bilingues FR/EN pour 3 marques BtoB (Billat, Plastic Billat, Socoplast)',
            "Migration et h\u00e9bergement autonome de l'ensemble des sites (O2Switch)",
            'Supports marketing, coordination de 70 packagings, photo produit, salon Automechanika Frankfurt 2026',
            'Gestion des fiches produits sur le PIM de Feu Vert' ] },
        { date: 'Sept. 2021 \u2013 Sept. 2023', tag: 'Alternance', role: 'Charg\u00e9 de webmarketing', company: 'M\u00e9ta-Coaching \u00b7 Paris', items: [
            "Coordination d'\u00e9quipes (m\u00e9decins, designers, devs) : 8 sites refondus + 2 cr\u00e9\u00e9s (ThéraTabac, ThéraVitalia)",
            'Marketing automation Brevo sur 10 000 contacts (triggers comportementaux)',
            'Tunnels de conversion : questionnaires bilan avec scoring m\u00e9dical',
            'Remont\u00e9es clients & r\u00e9solution de bugs (Redmine, CMS, back-office)' ] },
        { date: 'Avril \u2013 Juillet 2021', tag: 'Stage', role: 'Chef de produit junior', company: 'EWS BV \u00b7 Geldrop, Pays-Bas', items: [
            'N\u00e9gociation directe fournisseurs chinois : \u00e9tude de march\u00e9, co\u00fbts de transport (40HQ)',
            "Lancement d'une gamme de 4 bureaux gaming (toujours commercialis\u00e9e en 2026)",
            'Service client et retours sur les ventes en ligne' ] },
    ];
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const render = (i) => {
        const d = DATA[i];
        panel.innerHTML = '<p class="p-date">' + esc(d.date) + ' \u00b7 ' + esc(d.tag) + '</p>'
            + '<h3 class="p-role">' + esc(d.role) + '</h3>'
            + '<p class="p-company">' + esc(d.company) + '</p>'
            + '<ul>' + d.items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    };
    const select = (i) => {
        drawers.forEach((dr, j) => {
            const on = j === i;
            dr.classList.toggle('is-out', on);
            dr.classList.toggle('is-active', on);
            dr.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        render(i);
    };
    drawers.forEach((dr, i) => dr.addEventListener('click', () => select(i)));
    select(0);
};

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initSitePreviews();
    initLightbox();
    initRealisationTimeline();
    initCabinet();
});
