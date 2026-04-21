async function loadComponent(htmlPath, containerId, scriptPath) { 
    const response = await fetch(htmlPath); 
    const html = await response.text(); 
    const container = document.getElementById(containerId);
    if (!container) {
        // Container not present on this page — skip injecting this component.
        return;
    }
    container.innerHTML = html; 

    if (scriptPath) { 
        const script = document.createElement('script'); 
        script.src = scriptPath; 
        document.body.appendChild(script); 
    }
}

const AUTH_USERS_KEY = 'heartsync_users';
const AUTH_SESSION_KEY = 'heartsync_session';
const PROFILE_PREFIX = 'heartsync_profile_';

function readJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function getCurrentSession() {
    return readJSON(AUTH_SESSION_KEY, null);
}

function getStoredUsers() {
    return readJSON(AUTH_USERS_KEY, []);
}

function getProfileForEmail(email) {
    if (!email) {
        return null;
    }
    return readJSON(`${PROFILE_PREFIX}${email.toLowerCase()}`, null);
}

function getCurrentUser() {
    const session = getCurrentSession();
    if (!session?.email) {
        return null;
    }
    const email = session.email.toLowerCase();
    const account = getStoredUsers().find((user) => user.email === email);
    const profile = getProfileForEmail(email) || {};
    const nameFromEmail = email.split('@')[0];
    const displayName = (profile.name || account?.name || nameFromEmail || 'Member').trim();
    const avatarLetter = (profile.avatarLetter || displayName.charAt(0) || 'H').toUpperCase();

    return {
        email,
        name: displayName,
        avatarLetter,
        profileImage: profile.profileImage || ''
    };
}

function signOut() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    location.href = './home_page.html';
}

function renderAuthNavState() {
    const currentUser = getCurrentUser();
    const navCta = document.querySelector('#load_navigation .nav-cta');
    const mobileCta = document.querySelector('#load_navigation .nav-mobile-cta');
    if (!navCta || !mobileCta) {
        return;
    }

    if (!currentUser) {
        navCta.innerHTML = '<a href="./login_page.html" class="btn-primary">Join Free</a>';
        mobileCta.innerHTML = '<a href="./login_page.html" class="btn-outline">Log In</a><a href="./login_page.html" class="btn-primary">Join Free</a>';
        return;
    }

    const avatarMarkup = currentUser.profileImage
        ? `<span class="nav-user-avatar nav-user-avatar-image" style="background-image:url('${currentUser.profileImage}')"></span>`
        : `<span class="nav-user-avatar">${currentUser.avatarLetter}</span>`;

    navCta.innerHTML = `
        <a href="./profile_page.html" class="nav-user-link" title="Open profile">
            ${avatarMarkup}
            <span class="nav-user-name">${currentUser.name}</span>
        </a>
        <button type="button" class="nav-signout" id="navSignOut">Log Out</button>
    `;

    mobileCta.innerHTML = `
        <a href="./profile_page.html" class="nav-user-link nav-user-link-mobile" title="Open profile">
            ${avatarMarkup}
            <span class="nav-user-name">${currentUser.name}</span>
        </a>
        <button type="button" class="nav-signout" id="navSignOutMobile">Log Out</button>
    `;

    document.getElementById('navSignOut')?.addEventListener('click', signOut);
    document.getElementById('navSignOutMobile')?.addEventListener('click', signOut);
}

// ── Active nav link ─────────────────────────────────
function setActiveNavLink() {
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('#load_navigation .nav-links a');
    navLinks.forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();
        link.classList.toggle('active', linkFile === currentFile);
    });
}

// ── Shared navbar behaviour (scroll + hamburger) ────
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinksList = document.getElementById('navLinks');

    if (navbar) {
        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    if (hamburger && navLinksList) {
        hamburger.addEventListener('click', () => navLinksList.classList.toggle('open'));
        navLinksList.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navLinksList.classList.remove('open'));
        });
    }
}

// Load Components 
async function initComponents() {
    const navContainer = document.getElementById('load_navigation');
    if (navContainer) {
        await loadComponent('../frontend/components/navigation.html', 'load_navigation', '');
        setActiveNavLink();
        initNavbar();
        renderAuthNavState();
    }
    await loadComponent('../frontend/components/footer.html', 'load_footer', '');
}

window.HeartSyncAuth = {
    getCurrentUser,
    getProfileForEmail,
    signOut
};

initComponents();
