// ============================================
// SPHÈRE MENU MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const sphereMenuContainer = document.querySelector('.sphere-menu-container');
    const sphereMenu = document.getElementById('sphereMenu');
    const menuDropdown = document.getElementById('menuDropdown');
    
    // Initialisation du menu sphère si les éléments sont présents
    if (!sphereMenuContainer || !sphereMenu || !menuDropdown) {
        console.warn('Éléments du menu non trouvés');
    } else {
        let isMenuOpen = false;
        let lastScrollY = 0;
        let ticking = false;

        // Fonction pour gérer le scroll (raf-throttled pour éviter les à-coups sur mobile)
        const handleScroll = () => {
            lastScrollY = window.scrollY || window.pageYOffset || 0;
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    ticking = false;
                    if (lastScrollY > 100) {
                sphereMenuContainer.classList.add('scrolled');
            } else {
                sphereMenuContainer.classList.remove('scrolled');
            }
                });
            }
        };

        // Écouter le scroll (passive pour meilleures perfs)
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        // Fonction pour ouvrir le menu
        function openMenu() {
            isMenuOpen = true;
            menuDropdown.classList.add('active');
            sphereMenuContainer.classList.add('menu-open');
        }

        // Fonction pour fermer le menu
        function closeMenu() {
            isMenuOpen = false;
            menuDropdown.classList.remove('active');
            sphereMenuContainer.classList.remove('menu-open');
        }

        // Event listeners pour ouvrir au survol
        sphereMenuContainer.addEventListener('mouseenter', openMenu);
        
        // Event listeners pour fermer quand on quitte le conteneur
        sphereMenuContainer.addEventListener('mouseleave', closeMenu);

        // Gestion des clics sur les éléments de menu
        document.querySelectorAll('.menu-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                // Naviguer vers la section correspondante
                const sections = ['about', 'experiences', 'formation', 'competences', 'outils', 'voyage', 'contact'];
                if (sections[index]) {
                    const targetSection = document.getElementById(sections[index]);
                    if (targetSection) {
                        // En mode scrolled, scroller directement en haut de la section
                        const isScrolled = sphereMenuContainer.classList.contains('scrolled');
                        if (isScrolled) {
                            const targetOffset = targetSection.offsetTop;
                            window.scrollTo({ top: targetOffset, behavior: 'smooth' });
                        } else {
                            targetSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            });
        });

        // Initialiser au chargement
        handleScroll();
    }

    initToolAccordion();

    // ================================
    // Particules de fond (site-wide)
    // ================================
    const siteParticlesRoot = document.getElementById('siteParticles');
    if (siteParticlesRoot) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const maxParticles = isMobile ? 35 : 80; // réduction forte sur mobile
        const spawnEveryMs = isMobile ? 900 : 450; // fréquence plus lente

        function spawnParticle() {
            if (!siteParticlesRoot) return;
            // Limite le nombre d'éléments enfants
            if (siteParticlesRoot.childElementCount > maxParticles) {
                // Retire les plus anciens
                while (siteParticlesRoot.childElementCount > maxParticles) {
                    siteParticlesRoot.removeChild(siteParticlesRoot.firstChild);
                }
            }

            const p = document.createElement('span');
            p.className = 'site-particle';

            // Taille (2px à 6px), opacité (.35 à .85), durée (2s à 6s)
            const size = (Math.random() * 4 + 2).toFixed(1) + 'px';
            const opacity = (Math.random() * 0.5 + 0.35).toFixed(2);
            const duration = (Math.random() * 4 + 2).toFixed(2) + 's';

            // Position de départ aléatoire sur l'écran
            const startLeft = Math.random() * 100; // en vw
            const startTop = Math.random() * 100;  // en vh

            // Déplacement aléatoire (dx, dy)
            const dx = (Math.random() * 160 - 80).toFixed(1) + 'px';
            const dy = (Math.random() * -120 - 40).toFixed(1) + 'px';

            p.style.left = startLeft + 'vw';
            p.style.top = startTop + 'vh';
            p.style.setProperty('--sz', size);
            p.style.setProperty('--op', opacity);
            p.style.setProperty('--dur', duration);
            p.style.setProperty('--dx', dx);
            p.style.setProperty('--dy', dy);

            p.addEventListener('animationend', () => {
                if (p.parentNode) p.parentNode.removeChild(p);
            });

            siteParticlesRoot.appendChild(p);
        }

        // Démarre la génération avec un délai pour ne pas bloquer le rendu initial
        setTimeout(() => {
            setInterval(spawnParticle, spawnEveryMs);
        }, 800);
    }

    function initToolAccordion() {
        const categories = Array.from(document.querySelectorAll('.tool-category'));
        if (!categories.length) return;

        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const setCategoryState = (category, expanded) => {
            const header = category.querySelector('.category-header');
            const grid = category.querySelector('.tools-grid');
            if (expanded) {
                category.classList.add('is-open');
            } else {
                category.classList.remove('is-open');
            }

            if (header) {
                header.setAttribute('aria-expanded', expanded.toString());
            }
            if (grid) {
                grid.setAttribute('aria-hidden', (!expanded).toString());
            }
        };

        const closeAllCategories = () => {
            categories.forEach(category => setCategoryState(category, false));
        };

        const toggleCategory = (category) => {
            if (!mediaQuery.matches) return;

            const shouldOpen = !category.classList.contains('is-open');
            closeAllCategories();
            setCategoryState(category, shouldOpen);
        };

        categories.forEach(category => {
            const header = category.querySelector('.category-header');
            if (!header) return;

            header.addEventListener('click', () => toggleCategory(category));
            header.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleCategory(category);
                }
            });
        });

        const applyResponsiveState = () => {
            if (mediaQuery.matches) {
                closeAllCategories();
            } else {
                categories.forEach(category => setCategoryState(category, true));
            }
        };

        mediaQuery.addEventListener('change', applyResponsiveState);
        applyResponsiveState();
    }
});

// (Removed duplicate smooth scroll handler; GSAP handler below is used)

// Scroll animations with IntersectionObserver
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for scroll animations (exclure le hero qui est visible dès le chargement)
document.querySelectorAll('section:not(.hero)').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(section);
});

// Initialize GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Smooth scroll behavior for all anchor links with GSAP
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 50
                },
                ease: "power2.inOut"
            });
        }
    });
});

// ============================================
// VOYAGE CAROUSEL - Initialisé dans index.html
// ============================================

// ============================================
// EXPERIENCES SLIDER
// ============================================

const ExperienceSlider = () => {
    const slider = document.querySelector('.experiences-slider');
    const trail = document.querySelectorAll('.exp-trail-item');
    
    if (!slider || trail.length === 0) return;
    
    let value = 0;
    let trailValue = 0;
    const interval = 8000; // Augmenté à 8 secondes
    
    const slide = (condition) => {
        clearInterval(start);
        condition === "increase" ? initiateINC() : initiateDEC();
        move(value, trailValue);
        animate();
        start = setInterval(() => slide("increase"), interval);
    };
    
    const initiateINC = () => {
        trail.forEach(cur => cur.classList.remove("active"));
        value === 75 ? value = 0 : value += 25;
        trailUpdate();
    };
    
    const initiateDEC = () => {
        trail.forEach(cur => cur.classList.remove("active"));
        value === 0 ? value = 75 : value -= 25;
        trailUpdate();
    };
    
    const move = (S, T) => {
        slider.style.transform = `translateX(-${S}%)`;
        if (trail[T]) trail[T].classList.add("active");
    };
    
    const tl = gsap.timeline({defaults: {duration: 0.6, ease: "power2.inOut"}});
    tl.from(".exp-bg", {x: "-100%", opacity: 0})
      .from(".exp-title", {opacity: 0, y: "30px"}, "-=0.3")
      .from(".exp-tasks", {opacity: 0, y: "20px"}, "-=0.4");
    
    const animate = () => tl.restart();
    
    const trailUpdate = () => {
        if (value === 0) trailValue = 0;
        else if (value === 25) trailValue = 1;
        else if (value === 50) trailValue = 2;
        else trailValue = 3;
    };
    
    const clickCheck = (e) => {
        clearInterval(start);
        trail.forEach(cur => cur.classList.remove("active"));
        const check = e.target;
        check.classList.add("active");
        
        if (check.classList.contains("exp-box1")) value = 0;
        else if (check.classList.contains("exp-box2")) value = 25;
        else if (check.classList.contains("exp-box3")) value = 50;
        else value = 75;
        
        trailUpdate();
        move(value, trailValue);
        animate();
        start = setInterval(() => slide("increase"), interval);
    };
    
    // Navigation buttons
    const prevBtn = document.querySelector('.exp-prev');
    const nextBtn = document.querySelector('.exp-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            slide("decrease");
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            slide("increase");
        });
    }
    
    // Trail clicks
    trail.forEach(cur => cur.addEventListener('click', clickCheck));
    
    // Touch support
    let touchStart, touchMove, touchChange, sliderWidth;
    
    slider.addEventListener("touchstart", (e) => {
        touchStart = e.touches[0].clientX;
        sliderWidth = slider.clientWidth / trail.length;
    });
    
    slider.addEventListener("touchmove", (e) => {
        e.preventDefault();
        touchMove = e.touches[0].clientX;
        touchChange = touchStart - touchMove;
    });
    
    slider.addEventListener("touchend", () => {
        if (touchChange > (sliderWidth/4)) slide("increase");
        if ((touchChange * -1) > (sliderWidth/4)) slide("decrease");
        [touchStart, touchMove, touchChange, sliderWidth] = [0, 0, 0, 0];
    });
    
    // Start auto-slide
    let start = setInterval(() => slide("increase"), interval);
};

// Initialize page when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Force la page à commencer en haut
    window.scrollTo(0, 0);
    
    // Initialize experiences slider
    ExperienceSlider();
});

