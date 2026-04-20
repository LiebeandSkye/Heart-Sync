document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const formContent = document.getElementById('formContent');
    const success = document.getElementById('contactSuccess');
    const submitBtn = document.getElementById('contactSubmit');
    const submitLabel = submitBtn?.querySelector('span');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = 'Sending…';

        // Simulate a short send delay then show success
        setTimeout(() => {
            if (formContent) formContent.hidden = true;
            if (success) success.hidden = false;
        }, 1600);
    });
});
