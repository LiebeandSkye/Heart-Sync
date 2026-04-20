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
    }
    await loadComponent('../frontend/components/footer.html', 'load_footer', '');
}

initComponents();
