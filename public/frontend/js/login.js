document.addEventListener('DOMContentLoaded', () => {

    const AUTH_USERS_KEY = 'heartsync_users';
    const AUTH_SESSION_KEY = 'heartsync_session';
    const PROFILE_PREFIX = 'heartsync_profile_';
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

    const signInTab = document.getElementById('signInTab');
    const registerTab = document.getElementById('registerTab');
    const displayNameField = document.getElementById('displayNameField');
    const confirmField = document.getElementById('confirmPasswordField');
    const loginSubmit = document.getElementById('loginSubmit');
    const forgotLink = document.getElementById('forgotLink');
    const loginForm = document.getElementById('loginForm');
    const loginState = document.getElementById('loginState');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const displayNameInput = document.getElementById('displayName');
    const anonymousButton = document.getElementById('anonymousButton');

    let authMode = 'signin';

    function getUsers() {
        try {
            const raw = localStorage.getItem(AUTH_USERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function setUsers(users) {
        localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    }

    function getDefaultNameFromEmail(email) {
        const localPart = (email || '').split('@')[0] || 'member';
        return localPart.replace(/[._-]+/g, ' ').trim().slice(0, 32) || 'HeartSync Member';
    }

    function upsertBasicProfile(email, name) {
        const profileKey = `${PROFILE_PREFIX}${email.toLowerCase()}`;
        const existing = localStorage.getItem(profileKey);
        if (existing) {
            return;
        }
        const safeName = (name || '').trim() || getDefaultNameFromEmail(email);
        localStorage.setItem(profileKey, JSON.stringify({
            name: safeName,
            age: '',
            status: 'Ready to meet someone kind',
            location: 'Phnom Penh, KH',
            bio: 'Tell people about your vibe and what kind of connection you want.',
            interests: [],
            isOnline: true,
            avatarLetter: safeName.charAt(0).toUpperCase() || 'H',
            accent: '#ff4d6d',
            banner: '#2b2d42',
            profileImage: ''
        }));
    }

    function setSession(email) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
            email: email.toLowerCase(),
            signedInAt: Date.now()
        }));
    }

    function setState(message, isError = false) {
        if (!loginState) {
            return;
        }
        loginState.textContent = message;
        loginState.style.color = isError ? '#d62839' : '#2f7a46';
    }

    function setTab(mode) {
        const isRegister = mode === 'register';
        authMode = mode;
        signInTab?.classList.toggle('active', !isRegister);
        registerTab?.classList.toggle('active', isRegister);
        if (displayNameField) displayNameField.hidden = !isRegister;
        if (confirmField) confirmField.hidden = !isRegister;
        if (loginSubmit) loginSubmit.textContent = isRegister ? 'Create Account' : 'Sign In';
        if (forgotLink) forgotLink.style.display = isRegister ? 'none' : '';
        if (displayNameInput) displayNameInput.required = isRegister;
        if (confirmPasswordInput) confirmPasswordInput.required = isRegister;
        setState('');
    }

    signInTab?.addEventListener('click', () => setTab('signin'));
    registerTab?.addEventListener('click', () => setTab('register'));

    loginForm?.addEventListener('submit', (event) => {
        event.preventDefault();

        const email = (emailInput?.value || '').trim().toLowerCase();
        const password = (passwordInput?.value || '').trim();
        const displayName = (displayNameInput?.value || '').trim();
        const confirmPassword = (confirmPasswordInput?.value || '').trim();

        if (!email || !password) {
            setState('Please enter your email and password.', true);
            return;
        }

        const users = getUsers();
        const existingUser = users.find((user) => user.email === email);

        if (authMode === 'register') {
            if (!displayName) {
                setState('Please add a display name.', true);
                return;
            }
            if (password.length < 6) {
                setState('Password must be at least 6 characters.', true);
                return;
            }
            if (password !== confirmPassword) {
                setState('Passwords do not match.', true);
                return;
            }
            if (existingUser) {
                setState('This email is already registered. Please sign in.', true);
                return;
            }

            users.push({
                email,
                password,
                name: displayName,
                createdAt: Date.now()
            });
            setUsers(users);
            upsertBasicProfile(email, displayName);
            setSession(email);
            setState('Account created. Redirecting to your profile...');
            window.setTimeout(() => {
                window.location.href = './profile_page.html';
            }, 500);
            return;
        }

        if (!existingUser || existingUser.password !== password) {
            setState('Invalid email or password.', true);
            return;
        }

        upsertBasicProfile(email, existingUser.name || getDefaultNameFromEmail(email));
        setSession(email);
        setState('Signed in successfully. Redirecting...');
        window.setTimeout(() => {
            window.location.href = './home_page.html';
        }, 400);
    });

    anonymousButton?.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = './home_page.html';
    });

    try {
        const currentSession = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
        if (currentSession?.email) {
            window.location.href = './profile_page.html';
        }
    } catch {
    }
});
