async function loadComponent(htmlPath, containerId, scriptPath) { 
    const response = await fetch(htmlPath); 
    const html = await response.text(); 
    document.getElementById(containerId).innerHTML = html; 

    if (scriptPath) { 
        const script = document.createElement('script'); 
        script.src = scriptPath; 
        document.body.appendChild(script); 
    }
}

// Load Components 
loadComponent('../utilities/navigation.html', 'load_navigation', '');

// Add Invisible Layer Above Navigation 
window.addEventListener('load', () => { 
    const loadTime = document.querySelector('body'); 
    if (location.pathname === '../pages/signup/signup.html') { loadTime.classList.remove('active') }
    else if (location.pathname === '../pages/home/home.html' 
        || location.pathname === '../pages/connection/connection.html' 
        || location.pathname === '../pages/profile/profile.html' 
        || location.pathname === '../pages/about/about.html'
    ) { setTimeout(() => { loadTime.classList.remove('active') }, 2000) }
    else { setTimeout(() => { loadTime.classList.remove('active') }, 2700) }
})
