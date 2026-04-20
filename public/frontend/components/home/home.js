(function () {

    // ── Floating Hearts Background ──────────────────
    const heartsBg = document.getElementById('heartsBg');
    const heartEmojis = ['♥', '❤', '💕', '💗', '💖'];
    const HEART_COUNT = 18;

    for (let i = 0; i < HEART_COUNT; i++) {
        const el = document.createElement('span');
        el.classList.add('floating-heart');
        el.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        el.style.setProperty('--dur', (6 + Math.random() * 8) + 's');
        el.style.setProperty('--delay', (Math.random() * 10) + 's');
        el.style.left = (Math.random() * 100) + '%';
        el.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
        heartsBg.appendChild(el);
    }

    // ── Navbar Scroll Effect ────────────────────────
    const navbar = document.getElementById('navbar');
    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Hamburger Menu ──────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    hamburger?.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
    // Close on link click
    navLinks?.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // ── Testimonials Slider ─────────────────────────
    const track = document.getElementById('testimonialsTrack');
    const dotsWrap = document.getElementById('testiDots');
    const prevBtn = document.getElementById('testiPrev');
    const nextBtn = document.getElementById('testiNext');

    if (track) {
        const cards = track.querySelectorAll('.testi-card');
        let current = 0;
        let autoTimer;

        // Create dots
        cards.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('testi-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(dot);
        });

        function goTo(idx) {
            current = (idx + cards.length) % cards.length;
            // On mobile show 1 card, else 2
            const perView = window.innerWidth < 768 ? 1 : 2;
            const cardWidth = cards[0].offsetWidth + 24; // gap = 24px
            track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            track.style.transform = `translateX(-${current * cardWidth}px)`;
            dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
            resetAuto();
        }

        function resetAuto() {
            clearInterval(autoTimer);
            autoTimer = setInterval(() => goTo(current + 1), 4500);
        }

        prevBtn?.addEventListener('click', () => goTo(current - 1));
        nextBtn?.addEventListener('click', () => goTo(current + 1));
        resetAuto();
    }

    // ── Counter Animation ───────────────────────────
    function animateCounter(el, target, duration = 2000) {
        const start = performance.now();
        const startVal = 0;
        const isLarge = target > 999;

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (target - startVal) * eased);

            if (isLarge) {
                el.textContent = current.toLocaleString();
            } else {
                el.textContent = current;
            }

            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = isLarge ? target.toLocaleString() : target;
        }
        requestAnimationFrame(tick);
    }

    // Intersection Observer for stats
    const statNums = document.querySelectorAll('.stats-num[data-target]');
    if (statNums.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.target, 10);
                    animateCounter(el, target);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.4 });

        statNums.forEach(el => observer.observe(el));
    }

    // Animate the feature stat card counter
    const counterEl = document.getElementById('counterMatches');
    if (counterEl) {
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounter(counterEl, 247, 1800);
                obs.unobserve(counterEl);
            }
        }, { threshold: 0.5 });
        obs.observe(counterEl);
    }

    // ── Scroll-reveal (fade in up) ──────────────────
    const revealEls = document.querySelectorAll(
        '.step-card, .feature-item, .testi-card, .stats-item, .float-card'
    );

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = (i * 0.08) + 's';
                entry.target.classList.add('fade-in-up');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealEls.forEach(el => revealObserver.observe(el));

    // ── Like/Skip Card Interaction ──────────────────
    const likeBtn = document.querySelector('.card-btn.like');
    const skipBtn = document.querySelector('.card-btn.skip');
    const mainCard = document.querySelector('.main-card');

    likeBtn?.addEventListener('click', () => {
        mainCard.style.transition = 'all 0.4s ease';
        mainCard.style.transform = 'translateX(80px) rotate(10deg) scale(0.95)';
        mainCard.style.opacity = '0';
        setTimeout(() => {
            mainCard.style.transition = 'none';
            mainCard.style.transform = 'translateX(-80px) rotate(-5deg)';
            mainCard.style.opacity = '0';
            setTimeout(() => {
                mainCard.style.transition = 'all 0.4s ease';
                mainCard.style.transform = 'translateX(0) rotate(0deg)';
                mainCard.style.opacity = '1';
            }, 50);
        }, 400);

        // Show match notification briefly
        const matchCard = document.querySelector('.float-card-2');
        if (matchCard) {
            matchCard.style.transform = 'scale(1.1)';
            matchCard.style.boxShadow = '0 16px 48px rgba(255, 77, 109, 0.4)';
            setTimeout(() => {
                matchCard.style.transform = '';
                matchCard.style.boxShadow = '';
            }, 800);
        }
    });

    skipBtn?.addEventListener('click', () => {
        mainCard.style.transition = 'all 0.4s ease';
        mainCard.style.transform = 'translateX(-80px) rotate(-10deg) scale(0.95)';
        mainCard.style.opacity = '0';
        setTimeout(() => {
            mainCard.style.transition = 'none';
            mainCard.style.transform = 'translateX(80px) rotate(5deg)';
            mainCard.style.opacity = '0';
            setTimeout(() => {
                mainCard.style.transition = 'all 0.4s ease';
                mainCard.style.transform = 'translateX(0) rotate(0deg)';
                mainCard.style.opacity = '1';
            }, 50);
        }, 400);
    });

    // ── Parallax subtle on hero blobs ───────────────
    const blob1 = document.querySelector('.blob-1');
    const blob2 = document.querySelector('.blob-2');
    document.addEventListener('mousemove', (e) => {
        if (!blob1 || !blob2) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 30;
        const y = (e.clientY / window.innerHeight - 0.5) * 30;
        blob1.style.transform = `translate(${x}px, ${y}px)`;
        blob2.style.transform = `translate(${-x}px, ${-y}px)`;
    });

    // ── Smooth anchor links ─────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

})();
