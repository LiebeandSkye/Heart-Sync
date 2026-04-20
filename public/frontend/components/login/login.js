(function () {
	const form = document.getElementById('loginForm');
	const tabs = document.querySelectorAll('.login-tab');
	const submitButton = document.getElementById('loginSubmit');
	const stateText = document.getElementById('loginState');
	const anonymousButton = document.getElementById('anonymousButton');
	const confirmField = document.getElementById('confirmPasswordField');
	const emailInput = document.getElementById('loginEmail');
	const passwordInput = document.getElementById('loginPassword');
	const confirmInput = document.getElementById('confirmPassword');

	let mode = 'signin';

	function setState(message) {
		stateText.textContent = message;
	}

	function syncMode(nextMode) {
		mode = nextMode;
		tabs.forEach((tab) => {
			tab.classList.toggle('active', tab.dataset.mode === mode);
		});
		confirmField.hidden = mode !== 'register';
		submitButton.textContent = mode === 'register' ? 'Create account' : 'Sign in';
		passwordInput.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
		setState('');
	}

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => syncMode(tab.dataset.mode));
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const email = emailInput.value.trim();
		const password = passwordInput.value;

		if (!email || !password) {
			setState('Enter your email and password.');
			return;
		}

		if (mode === 'register' && password !== confirmInput.value) {
			setState('Passwords do not match.');
			return;
		}

		submitButton.disabled = true;
		anonymousButton.disabled = true;
		setState(mode === 'register' ? 'Creating account...' : 'Signing in...');

		try {
			if (mode === 'register') {
				await window.App.firebase.registerEmail(email, password);
			} else {
				await window.App.firebase.signInEmail(email, password);
			}

			window.location.href = './home_page.html';
		} catch (error) {
			setState(error.message || 'Authentication failed.');
		} finally {
			submitButton.disabled = false;
			anonymousButton.disabled = false;
		}
	});

	anonymousButton.addEventListener('click', async () => {
		submitButton.disabled = true;
		anonymousButton.disabled = true;
		setState('Starting anonymous session...');

		try {
			await window.App.firebase.signInAnonymous();
			window.location.href = './home_page.html';
		} catch (error) {
			setState(error.message || 'Anonymous sign in failed.');
			submitButton.disabled = false;
			anonymousButton.disabled = false;
		}
	});

	syncMode('signin');
})();
