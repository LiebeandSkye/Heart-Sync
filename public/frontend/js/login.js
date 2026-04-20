document.addEventListener('DOMContentLoaded', () => {

    // ── Floating hearts in brand panel ──────────────
    const heartsContainer = document.getElementById('authHearts');
    if (heartsContainer) {
        const emojis = ['♥', '❤', '💕', '💗'];
        for (let i = 0; i < 14; i++) {
            const el = document.createElement('span');
            el.classList.add('auth-floating-heart');
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.setProperty('--dur', (6 + Math.random() * 8) + 's');
            el.style.setProperty('--delay', (Math.random() * 10) + 's');
            el.style.left = (Math.random() * 100) + '%';
            el.style.fontSize = (0.7 + Math.random() * 1) + 'rem';
            heartsContainer.appendChild(el);
        }
    }

    // ── Tab switching (Sign In ↔ Create Account) ────
    const signInTab = document.getElementById('signInTab');
    const registerTab = document.getElementById('registerTab');
    const confirmField = document.getElementById('confirmPasswordField');
    const loginSubmit = document.getElementById('loginSubmit');
    const forgotLink = document.getElementById('forgotLink');

    function setTab(mode) {
        const isRegister = mode === 'register';
        signInTab?.classList.toggle('active', !isRegister);
        registerTab?.classList.toggle('active', isRegister);
        if (confirmField) confirmField.hidden = !isRegister;
        if (loginSubmit) loginSubmit.textContent = isRegister ? 'Create Account' : 'Sign In';
        if (forgotLink) forgotLink.style.display = isRegister ? 'none' : '';
    }

    signInTab?.addEventListener('click', () => setTab('signin'));
    registerTab?.addEventListener('click', () => setTab('register'));
});
