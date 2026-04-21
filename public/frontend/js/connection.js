// Connection Page — Chat Panel Toggle
// Handles open/close of chat overlays only. Messaging logic wired later.

document.addEventListener('DOMContentLoaded', () => {
    const globalPanel = document.getElementById('globalChatPanel');
    const directPanel = document.getElementById('directChatPanel');
    const openGlobalBtn = document.getElementById('openGlobalChat');
    const openDirectBtn = document.getElementById('openDirectChat');

    function openPanel(panel) {
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('panel-open');
    }

    function closePanel(panel) {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
        if (!globalPanel.classList.contains('active') && !directPanel.classList.contains('active')) {
            document.body.classList.remove('panel-open');
        }
    }

    // FAB open buttons
    openGlobalBtn.addEventListener('click', () => openPanel(globalPanel));
    openDirectBtn.addEventListener('click', () => openPanel(directPanel));

    // Close buttons (data-panel="global" or "direct")
    document.querySelectorAll('.panel-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.panel === 'global' ? globalPanel : directPanel;
            closePanel(target);
        });
    });

    // Click the backdrop (overlay itself) to close
    [globalPanel, directPanel].forEach(panel => {
        panel.addEventListener('click', e => {
            if (e.target === panel) closePanel(panel);
        });
    });

    // Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (globalPanel.classList.contains('active')) closePanel(globalPanel);
            if (directPanel.classList.contains('active')) closePanel(directPanel);
        }
    });
});