(function () {
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    const logoutButton = document.getElementById('logoutButton');
    const authChip = document.getElementById('authChip');
    const currentPath = window.location.pathname.split('/').pop();

    navLinks?.querySelectorAll('a[data-route]').forEach((link) => {
        link.classList.toggle('active', link.dataset.route === currentPath);
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger?.setAttribute('aria-expanded', 'false');
        });
    });

    hamburger?.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    window.addEventListener('scroll', () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 24);
    }, { passive: true });

    if (window.App && window.App.firebase && typeof window.App.firebase.onAuthReady === 'function') {
        window.App.firebase.onAuthReady().then((user) => {
            if (!authChip) {
                return;
            }

            if (!user) {
                authChip.textContent = 'Guest';
                return;
            }

            authChip.textContent = user.isAnonymous ? 'Anonymous' : (user.email || 'Signed in');
        });
    }

    logoutButton?.addEventListener('click', async () => {
        try {
            if (window.App && window.App.firebase && typeof window.App.firebase.signOutUser === 'function') {
                await window.App.firebase.signOutUser();
            }
        } finally {
            window.location.href = './login_page.html';
        }
    });
})();
