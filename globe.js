// ============================================================
//  Globe voyage — planisphère pointillé + pins pulsants (vanilla).
//  Carte en points (images/world-dots.svg, projection équirect.),
//  pins lumineux sur les 13 pays.
//    - PC (souris)   : la photo du pays s'affiche AU SURVOL du point.
//    - Mobile/tactile: tap sur le point = photo du pays (modal).
//  Port vanilla d'un composant React (globe 21st.dev).
// ============================================================
(function () {
    const el = document.getElementById('voyageGlobe');
    if (!el) return;

    const W = 1000, H = 500;
    // lon/lat représentatifs de chaque pays visité
    const COUNTRIES = [
        { name: 'Inde', slug: 'inde', lon: 79.0, lat: 22.5 },
        { name: 'Népal', slug: 'nepal', lon: 84.1, lat: 28.3 },
        { name: 'Thaïlande', slug: 'thailande', lon: 101.0, lat: 15.5 },
        { name: 'Laos', slug: 'laos', lon: 103.8, lat: 18.5 },
        { name: 'Cambodge', slug: 'cambodge', lon: 105.0, lat: 12.5 },
        { name: 'Vietnam', slug: 'vietnam', lon: 107.5, lat: 16.0 },
        { name: 'Indonésie', slug: 'indonesie', lon: 113.0, lat: -2.0 },
        { name: 'Singapour', slug: 'singapour', lon: 103.8, lat: 1.3 },
        { name: 'Australie', slug: 'australie', lon: 134.0, lat: -25.0 },
        { name: 'Nouvelle-Zélande', slug: 'nouvelle-zelande', lon: 172.0, lat: -42.0 },
        { name: 'Pérou', slug: 'perou', lon: -75.5, lat: -9.5 },
        { name: 'Colombie', slug: 'colombie', lon: -73.5, lat: 4.2 },
        { name: 'Bolivie', slug: 'bolivie', lon: -64.5, lat: -16.5 },
    ];
    const NS = 'http://www.w3.org/2000/svg';
    const proj = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
    const photo = (c) => 'images/voyage/' + c.slug + '.webp';

    // Souris fine + survol possible = "desktop" -> photo au survol, pas de clic.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    el.classList.add(canHover ? 'can-hover' : 'is-touch');

    fetch('images/world-dots.svg?v=47')
        .then(r => r.text())
        .then(txt => {
            el.insertAdjacentHTML('afterbegin', txt);
            const svg = el.querySelector('svg.globe-dots');
            if (svg) buildPins(svg);
        })
        .catch(() => { /* pas de carte : on laisse la section sans visuel */ });

    // Précharge les photos sur desktop pour un survol instantané.
    if (canHover) COUNTRIES.forEach(c => { const im = new Image(); im.src = photo(c); });

    function buildPins(svg) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'globe-pins');
        COUNTRIES.forEach((c, i) => {
            const [x, y] = proj(c.lon, c.lat);
            const pin = document.createElementNS(NS, 'g');
            pin.setAttribute('class', 'globe-pin');
            pin.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
            pin.setAttribute('tabindex', '0');
            pin.setAttribute('role', canHover ? 'img' : 'button');
            pin.setAttribute('aria-label', canHover ? c.name : c.name + ' — voir la photo');
            pin.style.setProperty('--d', (i * 0.17).toFixed(2) + 's');
            const halo = document.createElementNS(NS, 'circle');
            halo.setAttribute('class', 'pin-halo'); halo.setAttribute('r', '9');
            const core = document.createElementNS(NS, 'circle');
            core.setAttribute('class', 'pin-core'); core.setAttribute('r', '3.4');
            const hit = document.createElementNS(NS, 'circle');
            hit.setAttribute('class', 'pin-hit'); hit.setAttribute('r', '16');
            hit.setAttribute('fill', 'transparent');
            pin.appendChild(halo); pin.appendChild(core); pin.appendChild(hit);

            if (canHover) {
                // Desktop : survol / focus clavier -> apercu photo. Pas de clic.
                pin.addEventListener('mouseenter', () => showTip(c, x, y));
                pin.addEventListener('mouseleave', hideTip);
                pin.addEventListener('focus', () => showTip(c, x, y));
                pin.addEventListener('blur', hideTip);
            } else {
                // Mobile/tactile : tap -> modal photo.
                pin.addEventListener('click', () => openModal(c));
                pin.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(c); } });
            }
            g.appendChild(pin);
        });
        svg.appendChild(g);
    }

    // Apercu au survol (desktop) : photo + nom, positionne pres du point.
    let tip = null;
    function showTip(c, x, y) {
        if (!tip) { tip = document.createElement('div'); tip.className = 'globe-tip'; el.appendChild(tip); }
        const px = x / W * 100, py = y / H * 100;
        tip.className = 'globe-tip has-photo';
        tip.innerHTML = '<img src="' + photo(c) + '" alt=""><span>' + c.name + '</span>';
        tip.style.left = Math.min(90, Math.max(10, px)) + '%';
        tip.style.top = py + '%';
        tip.classList.toggle('below', py < 32);
        requestAnimationFrame(() => tip.classList.add('on'));
    }
    function hideTip() { if (tip) tip.classList.remove('on'); }

    // Modal photo (mobile)
    let modal = null;
    function ensureModal() {
        if (modal) return;
        modal = document.createElement('div');
        modal.className = 'globe-modal';
        modal.innerHTML = '<div class="globe-modal-card"><button class="globe-modal-close" aria-label="Fermer">×</button><img alt=""><p class="globe-modal-title"></p></div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.globe-modal-close')) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
    function openModal(c) {
        ensureModal();
        const img = modal.querySelector('img');
        img.src = photo(c);
        img.alt = c.name;
        modal.querySelector('.globe-modal-title').textContent = c.name;
        modal.classList.add('open');
        document.body.classList.add('lb-open');
    }
    function closeModal() {
        if (modal) { modal.classList.remove('open'); document.body.classList.remove('lb-open'); }
    }
})();
