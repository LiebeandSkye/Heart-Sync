async function loadComponent(htmlPath, containerId, scriptPath) {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Missing container: ${containerId}`);
    }

    const response = await fetch(htmlPath);
    if (!response.ok) {
        throw new Error(`Failed to load component ${htmlPath}`);
    }

    container.innerHTML = await response.text();

    if (!scriptPath) {
        return container;
    }

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });

    return container;
}

function finishPageLoad(delay = 120) {
    window.setTimeout(() => {
        document.body.classList.remove('active');
    }, delay);
}

window.loadComponent = loadComponent;
window.finishPageLoad = finishPageLoad;
