// Utilisation de IIFE pour éviter la pollution du scope global
(function() {
    'use strict';

    document.addEventListener("DOMContentLoaded", function() {
        // Protection contre le clic droit sur les images uniquement
        document.addEventListener('contextmenu', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                showProtectionMessage();
            }
        });

        // Empêcher uniquement la sauvegarde des images
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'IMG') {
                    e.preventDefault();
                    showProtectionMessage();
                }
            }
        });

        function showProtectionMessage() {
            const message = document.createElement('div');
            message.className = 'protection-message';
            message.textContent = '© Images protégées - Hugo Barès';
            
            document.body.appendChild(message);
            
            setTimeout(() => {
                message.classList.add('show');
                setTimeout(() => {
                    message.classList.remove('show');
                    setTimeout(() => {
                        message.remove();
                    }, 300);
                }, 2000);
            }, 10);
        }

        // Gestion du texte animé
        const animatedText = document.getElementById("animated-text");
        if (animatedText) {
            const prefix = "Moi, Hugo Barès,<br>";
            const phrases = [
                "chef de projet web",
                "spécialisé CMS & gestion de projet",
                "expert WordPress / Drupal",
                "créatif, organisé, motivé"
            ];

            let phraseIndex = 0;
            let charIndex = 0;
            let isDeleting = false;

            function typeEffect() {
                const currentPhrase = phrases[phraseIndex];
                const displayedText = currentPhrase.substring(0, charIndex);
                animatedText.innerHTML = `${prefix}${displayedText}<span class="cursor">|</span>`;

                const typingSpeed = isDeleting ? 50 : 100;
                const delay = isDeleting ? 50 : (charIndex === currentPhrase.length ? 1000 : typingSpeed);

                if (!isDeleting && charIndex < currentPhrase.length) {
                    charIndex++;
                } else if (isDeleting && charIndex > 0) {
                    charIndex--;
                } else {
                    isDeleting = !isDeleting;
                    if (!isDeleting) {
                        phraseIndex = (phraseIndex + 1) % phrases.length;
                    }
                }

                setTimeout(typeEffect, delay);
            }

            typeEffect();
        }

        // Gestion du header au scroll
        const header = document.querySelector('header');
        const container = document.querySelector('.container');
        
        function checkHeaderPosition() {
            if (!header || !container) return;
            const containerBottom = container.offsetTop + container.offsetHeight;
            const scrollPosition = window.scrollY;
            header.classList.toggle('scrolled', scrollPosition > containerBottom - header.offsetHeight);
        }

        checkHeaderPosition();
        window.addEventListener('scroll', checkHeaderPosition);
        window.addEventListener('resize', checkHeaderPosition);

        // Menu mobile
        const toggle = document.getElementById('mobile-menu-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => header.classList.toggle('mobile-open'));
        }

        document.querySelectorAll('header nav a, .logo a').forEach(link => {
            link.addEventListener('click', () => header.classList.remove('mobile-open'));
        });

        // Timeline Animation
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (timelineItems.length) {
            function checkTimelineVisibility() {
                timelineItems.forEach(item => {
                    const rect = item.getBoundingClientRect();
                    item.classList.toggle('visible', rect.top <= window.innerHeight * 0.8);
                });
            }

            checkTimelineVisibility();
            window.addEventListener('scroll', checkTimelineVisibility);
        }

        // Lightbox pour les images
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const closeLightbox = document.querySelector('.close-lightbox');

        if (lightbox && lightboxImg && lightboxCaption) {
            document.querySelectorAll('.voyage-photo img').forEach(img => {
                img.addEventListener('click', function() {
                    lightbox.style.display = 'block';
                    lightboxImg.src = this.src;
                    lightboxCaption.textContent = this.alt;
                });
            });

            function closeLightboxHandler() {
                lightbox.style.display = 'none';
            }

            closeLightbox?.addEventListener('click', closeLightboxHandler);
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) closeLightboxHandler();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.style.display === 'block') {
                    closeLightboxHandler();
                }
            });
        }

        // Scroll fluide pour les ancres
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Gestion des mentions légales
        const showCreditsBtn = document.getElementById('show-credits');
        const hideCreditsBtn = document.getElementById('hide-credits');
        const creditsSection = document.querySelector('.credits-section');

        if (showCreditsBtn && hideCreditsBtn && creditsSection) {
            showCreditsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                creditsSection.style.display = 'block';
                setTimeout(() => {
                    creditsSection.classList.add('show');
                }, 10);
            });

            hideCreditsBtn.addEventListener('click', function() {
                creditsSection.classList.remove('show');
                setTimeout(() => {
                    creditsSection.style.display = 'none';
                }, 300);
            });
        }

        // Gestion du bouton Voir Plus pour les outils
        const voirPlusOutils = document.querySelector('.voir-plus-outils');
        if (voirPlusOutils) {
            voirPlusOutils.addEventListener('click', function() {
                const outilsItems = document.querySelectorAll('.outil-item:nth-child(n+5)');
                
                if (this.textContent === 'Voir plus') {
                    // Afficher les outils supplémentaires
                    outilsItems.forEach(item => {
                        item.classList.add('visible');
                    });
                    this.textContent = 'Voir moins';
                } else {
                    // Cacher les outils supplémentaires
                    outilsItems.forEach(item => {
                        item.classList.remove('visible');
                    });
                    this.textContent = 'Voir plus';
                }
            });
        }
    });
})();