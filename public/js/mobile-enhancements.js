/**
 * Melhorias Mobile - Funciona em mobile e desktop
 * Não interfere com a versão desktop - apenas melhora a experiência mobile
 */

(function() {
    'use strict';

    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Adicionar classes CSS para mobile
    if (isMobile || isTouch) {
        document.documentElement.classList.add('mobile-device');
        document.body.classList.add('mobile-device');
    }

    // Melhorar toque em botões (feedback visual)
    if (isTouch) {
        document.addEventListener('touchstart', function(e) {
            const target = e.target.closest('button, .btn-primary, .btn-secondary, a[href]');
            if (target && !target.classList.contains('no-touch-feedback')) {
                target.classList.add('touch-active');
            }
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            const targets = document.querySelectorAll('.touch-active');
            targets.forEach(target => {
                setTimeout(() => {
                    target.classList.remove('touch-active');
                }, 150);
            });
        }, { passive: true });
    }

    // Prevenir zoom duplo toque (melhor UX mobile)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Melhorar scroll em mobile
    if (isMobile) {
        // Adicionar smooth scroll
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Prevenir pull-to-refresh acidental
        let touchStartY = 0;
        document.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchmove', function(e) {
            // Se estiver no topo e tentar puxar para baixo, prevenir
            if (window.scrollY === 0 && e.touches[0].clientY > touchStartY) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Melhorar inputs em mobile (evitar zoom no iOS)
    if (isMobile) {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Aumentar tamanho da fonte para evitar zoom no iOS
            if (input.style.fontSize === '') {
                input.style.fontSize = '16px';
            }
        });
    }

    // Adicionar suporte a gestos de swipe (opcional)
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Swipe horizontal (pode ser usado para navegação)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe left - pode adicionar funcionalidade
                // console.log('Swipe left');
            } else {
                // Swipe right - voltar (se estiver em uma pasta)
                // Verificar se há função loadFiles disponível
                if (typeof window !== 'undefined' && window.loadFiles) {
                    // Voltar para pasta pai
                    const event = new CustomEvent('swipeBack');
                    document.dispatchEvent(event);
                }
            }
        }

        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });

    // Melhorar performance em mobile
    if (isMobile) {
        // Lazy load de imagens
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            // Observar imagens com data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Adicionar viewport fix para evitar problemas de layout
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && isMobile) {
        viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
        );
    }

    // Melhorar área segura para notches (iPhone X+)
    if (isMobile) {
        const style = document.createElement('style');
        style.textContent = `
            @supports (padding: max(0px)) {
                body {
                    padding-left: max(12px, env(safe-area-inset-left));
                    padding-right: max(12px, env(safe-area-inset-right));
                }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ Mobile enhancements carregados');
    console.log(`📱 Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`👆 Touch: ${isTouch ? 'Sim' : 'Não'}`);
})();

