// ============================================================
//  Glyph Portal — caméra pilotée au scroll à travers la typo.
//  Port vanilla fidèle du composant React de Christian Katzmann (MIT).
//  "A scroll-driven camera through live type. Keep this notice with copies."
// ============================================================
(function () {
    function clamp(n, a, b) { a = (a == null ? 0 : a); b = (b == null ? 1 : b); return Math.min(b, Math.max(a, n)); }
    function smooth(a, b, n) { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); }

    const section = document.getElementById('heroPortal');
    if (!section) return;
    const pin = section.querySelector('[data-gp-pin]');
    const field = section.querySelector('[data-gp-field]');
    const art = section.querySelector('[data-gp-art]');
    const clipId = 'portalClip';
    const clip = section.querySelector('#' + clipId);
    const glyph = section.querySelector('[data-gp-glyph]');
    const marks = section.querySelector('[data-gp-marks]');
    const choices = section.querySelector('[data-gp-choices]');
    const picker = section.querySelector('[data-gp-select]');
    const probe = section.querySelector('[data-gp-viewport]');
    if (!pin || !field || !art || !clip || !glyph || !marks || !choices || !picker || !probe) return;
    const buttons = Array.from(choices.querySelectorAll('button'));

    const text = (section.dataset.word || 'SUBLIME').trim().normalize('NFC') || 'SUBLIME';
    const length = clamp(parseFloat(getComputedStyle(section).getPropertyValue('--gp-length')) || 2.4, 1, 8);
    const weight = parseInt(section.dataset.weight || '700', 10);
    const interactive = section.dataset.interactive !== 'false';
    const fontFamily = section.dataset.font || '"Glyph Portal Jakarta","Arial Black","Arial",sans-serif';
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    let W = 1, H = 1, travel = 1, startScale = 1, endScale = 1;
    let center = { x: 0, y: 0 }, target = null, candidates = [], letters = [], bounds = { x: 0, y: 0, width: 1, height: 1 };
    let ready = false, raf = 0, dirty = true, active = true, browserFrameSeen = false, fontDirty = true, fontReady = false, choosing = false, lastProgress = -1;

    glyph.style.fontFamily = fontFamily;

    function interior(char, font) {
        if (!context) return null;
        context.font = font;
        const m = context.measureText(char);
        const pad = 8;
        const left = Math.ceil(m.actualBoundingBoxLeft);
        const ascent = Math.ceil(m.actualBoundingBoxAscent);
        canvas.width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2);
        canvas.height = Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2);
        context.font = font;
        context.fontKerning = 'none';
        context.fillText(char, pad + left, pad + ascent);
        const { width, height } = canvas;
        const pixels = context.getImageData(0, 0, width, height).data;
        const rows = new Uint16Array(width + 1);
        let size = 0, bx = 0, by = 0;
        for (let y = 0; y < height; y++) {
            let diagonal = 0;
            for (let x = 0; x < width; x++) {
                const above = rows[x + 1];
                rows[x + 1] = pixels[(y * width + x) * 4 + 3] > 245 ? Math.min(above, rows[x], diagonal) + 1 : 0;
                diagonal = above;
                if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
            }
        }
        if (size < 3) return null;
        return { x: (bx + 1 - size / 2 - pad - left) / 3, y: (by + 1 - size / 2 - pad - ascent) / 3, radius: (size / 2 - 1) / 3 };
    }

    function readInk() {
        if (!context) return false;
        const family = getComputedStyle(glyph).fontFamily;
        const scanFont = `${weight} 300px ${family}`;
        context.font = `${weight} 100px ${family}`;
        context.fontKerning = 'none';
        const metrics = context.measureText(text);
        const advances = Array.from({ length: text.length }, (_, i) => context.measureText(text.slice(0, i)).width);
        bounds = {
            x: -metrics.actualBoundingBoxLeft, y: -metrics.actualBoundingBoxAscent,
            width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        };
        if (!bounds.width || !bounds.height) return false;
        center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        candidates = []; letters = [];
        let offset = 0;
        for (const char of Array.from(text)) {
            context.font = `${weight} 100px ${family}`;
            const m = context.measureText(char);
            letters.push({ index: offset, x: advances[offset] - m.actualBoundingBoxLeft, y: -m.actualBoundingBoxAscent, width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent });
            const found = interior(char, scanFont);
            if (found) candidates.push({ x: found.x + advances[offset], y: found.y, radius: found.radius, index: offset });
            offset += char.length;
        }
        target = candidates.slice().sort((a, b) => b.radius - a.radius || Math.abs(a.x - center.x) - Math.abs(b.x - center.x))[0] || null;
        return true;
    }

    function select(next) {
        target = next;
        endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
        section.dataset.gpFocusIndex = String(target ? target.index : -1);
        for (const button of buttons) {
            const idx = Number(button.dataset.gpLetter);
            const selected = idx === (target ? target.index : -2);
            button.disabled = !candidates.some((c) => c.index === idx);
            button.setAttribute('aria-checked', String(selected));
            button.tabIndex = selected ? 0 : -1;
        }
        if (picker.value !== '') picker.value = String(target ? target.index : -1);
        for (const option of Array.from(picker.options)) option.disabled = option.value === '' || !candidates.some((c) => c.index === Number(option.value));
        const u = 1 / startScale;
        const y = bounds.y + bounds.height + 25 * u, x = bounds.x, right = x + bounds.width;
        const cross = target ? `M${target.x - 9 * u} ${target.y}h${18 * u}M${target.x} ${target.y - 9 * u}v${18 * u}` : '';
        const path = marks.querySelector('path');
        path.setAttribute('d', `M${x} ${y}H${right}M${x} ${y - 5 * u}v${10 * u}M${right} ${y - 5 * u}v${10 * u}${cross}`);
        path.setAttribute('stroke-width', String(u));
    }

    function layout() {
        if (!section.clientWidth) return;
        W = pin.clientWidth;
        const vh = Math.max(1, probe.offsetHeight);
        H = motion.matches ? Math.min(vh * 0.75, 480) : vh;
        section.style.setProperty('--gp-height', `${H}px`);
        travel = H * length;
        art.setAttribute('viewBox', `0 0 ${W} ${H}`);
        if (fontDirty) { ready = readInk(); fontDirty = false; }
        if (!ready) return;
        startScale = Math.min(W * 0.84 / bounds.width, (H * 0.38) / bounds.height);
        select(target);
        for (const button of buttons) {
            const letter = letters.find((l) => l.index === Number(button.dataset.gpLetter));
            if (!letter) continue;
            button.style.left = `${W / 2 + (letter.x - center.x) * startScale}px`;
            button.style.top = `${H * 0.46 + (letter.y - center.y) * startScale - Math.max(0, 44 - letter.height * startScale) / 2}px`;
            button.style.width = `${Math.max(1, letter.width * startScale)}px`;
            button.style.height = `${Math.max(44, letter.height * startScale)}px`;
        }
        section.style.setProperty('--gp-word-top', `${H * 0.46 - bounds.height * startScale / 2}px`);
        section.style.setProperty('--gp-word-bottom', `${H * 0.46 + bounds.height * startScale / 2}px`);
        section.dataset.gpReady = 'true';
        section.dataset.gpMotion = (!motion.matches && browserFrameSeen && fontReady && target) ? 'on' : 'off';
    }

    function paint(progress) {
        const isStatic = motion.matches || !browserFrameSeen || !fontReady || !target;
        const p = isStatic ? 0 : progress;
        const t = clamp(p / 0.78);
        const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
        const blend = endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
        const cx = center.x + ((target ? target.x : center.x) - center.x) * blend;
        const cy = center.y + ((target ? target.y : center.y) - center.y) * blend;
        const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
        const radians = roll * Math.PI / 180;
        const dx = W / 2 / scale, dy = (H * 0.46 + H * 0.04 * eased) / scale;
        const transform = `translate(${W / 2} ${H * 0.46 + H * 0.04 * eased}) scale(${scale}) rotate(${roll}) translate(${-cx} ${-cy})`;
        clip.setAttribute('transform', `scale(${scale}) rotate(${roll})`);
        glyph.setAttribute('transform', `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`);
        marks.setAttribute('transform', transform);
        marks.style.opacity = String(1 - smooth(0.015, 0.17, p));
        choosing = interactive && !isStatic && p < 0.04;
        choices.inert = !choosing;
        section.dataset.gpChoosing = String(choosing);
        field.style.clipPath = t >= 1 ? 'none' : `url(#${clipId})`;
        section.style.setProperty('--gp-caption', String(1 - smooth(0.01, 0.16, p)));
        section.style.setProperty('--gp-reveal', String(isStatic ? 1 : smooth(0.78, 0.9, p)));
        section.style.setProperty('--gp-field-scale', String(1 + 0.16 * smooth(0, 0.82, p)));
        section.style.setProperty('--gp-caption-hit', p < 0.08 ? 'auto' : 'none');
        section.dataset.gpEntered = String(p >= 0.9);
        document.body.classList.toggle('gp-hide-nav', active && p < 0.92);
    }

    const position = () => clamp((0 - section.getBoundingClientRect().top) / travel);

    function frame(time) {
        raf = 0;
        if (time !== undefined && !browserFrameSeen) { browserFrameSeen = true; dirty = true; }
        if (dirty) { dirty = false; layout(); }
        if (ready) paint(position());
    }
    function schedule() { if (!raf && active) raf = requestAnimationFrame(frame); }
    function resize() { cancelAnimationFrame(raf); dirty = true; frame(); }

    // Interactivité : choisir la lettre d'entrée
    const choose = (event) => {
        if (!choosing || position() >= 0.04) return;
        const button = event.target.closest('[data-gp-letter]');
        if (!button) return;
        const next = candidates.find((c) => c.index === Number(button.dataset.gpLetter));
        if (!next || next === target) return;
        select(next); paint(position());
    };
    const navigate = (event) => {
        if (!choosing || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = candidates.indexOf(target);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? candidates.length - 1
            : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + candidates.length) % candidates.length;
        const btn = buttons.find((b) => Number(b.dataset.gpLetter) === candidates[index].index);
        if (btn) btn.focus({ preventScroll: true });
    };
    const pick = () => {
        if (!choosing || position() >= 0.04) return;
        const next = candidates.find((c) => c.index === Number(picker.value));
        if (next) { select(next); paint(position()); }
    };
    choices.addEventListener('pointerover', choose);
    choices.addEventListener('click', choose);
    choices.addEventListener('focusin', choose);
    choices.addEventListener('keydown', navigate);
    picker.addEventListener('change', pick);

    new ResizeObserver(resize).observe(section);
    new IntersectionObserver(([entry]) => {
        active = entry.isIntersecting;
        if (active) { dirty = true; schedule(); }
        else { if (raf) { cancelAnimationFrame(raf); raf = 0; } document.body.classList.remove('gp-hide-nav'); }
    }, { rootMargin: '100% 0px' }).observe(section);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    motion.addEventListener('change', resize);

    // Police custom : mesurer avec une solution de repli, puis re-mesurer une fois prête.
    try { fontReady = document.fonts.check(`${weight} 100px ${fontFamily}`); } catch (e) { fontReady = true; }
    if (!fontReady && document.fonts) {
        document.fonts.load(`${weight} 100px ${fontFamily}`).catch(() => {});
        document.fonts.ready.then(() => { fontReady = true; fontDirty = true; dirty = true; schedule(); });
        window.setTimeout(() => { fontReady = true; fontDirty = true; dirty = true; schedule(); }, 1600);
    }

    frame();
    schedule();
})();
