document.addEventListener('DOMContentLoaded', () => {
	const AUTH_USERS_KEY = 'heartsync_users';
	const PROFILE_PREFIX = 'heartsync_profile_';

	const form = document.getElementById('profileForm');
	const saveState = document.getElementById('saveState');
	const resetButton = document.getElementById('resetProfile');
	const imageInput = document.getElementById('profileImageInput');
	const avatarPreviewRing = document.getElementById('avatarPreviewRing');

	const previewAvatarCircle = document.getElementById('avatarPreviewCircle');
	const previewCardAvatar = document.getElementById('previewAvatar');
	const previewBanner = document.getElementById('previewBanner');
	const previewName = document.getElementById('previewName');
	const previewHandle = document.getElementById('previewHandle');
	const previewBadge = document.getElementById('previewBadge');
	const previewStatus = document.getElementById('previewStatus');
	const previewBio = document.getElementById('previewBio');
	const previewLocation = document.getElementById('previewLocation');
	const previewInterests = document.getElementById('previewInterests');

	const currentUser = window.HeartSyncAuth?.getCurrentUser?.() || null;
	if (!currentUser?.email) {
		if (saveState) {
			saveState.textContent = 'Please sign in before editing your profile.';
			saveState.style.color = '#d62839';
		}
		window.setTimeout(() => {
			window.location.href = './login_page.html';
		}, 850);
		return;
	}

	const profileKey = `${PROFILE_PREFIX}${currentUser.email}`;

	function readJSON(key, fallback) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : fallback;
		} catch {
			return fallback;
		}
	}

	function writeJSON(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	function slugifyName(value) {
		return (value || 'unknown')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'unknown';
	}

	function defaultProfile() {
		const baseName = currentUser.name || 'Unknown';
		return {
			name: baseName,
			age: '',
			status: 'Ready to meet someone kind',
			location: 'Phnom Penh, KH',
			bio: 'Tell people about your vibe and what kind of connection you want.',
			interests: [],
			isOnline: true,
			avatarLetter: (baseName.charAt(0) || 'H').toUpperCase(),
			accent: '#ff4d6d',
			banner: '#2b2d42',
			profileImage: ''
		};
	}

	let profileData = {
		...defaultProfile(),
		...readJSON(profileKey, {})
	};

	function setAvatarVisual(targetEl, imageDataUrl, letter, accent) {
		if (!targetEl) {
			return;
		}

		if (imageDataUrl) {
			targetEl.style.backgroundImage = `url('${imageDataUrl}')`;
			targetEl.style.backgroundSize = 'cover';
			targetEl.style.backgroundPosition = 'center';
			targetEl.style.backgroundRepeat = 'no-repeat';
			targetEl.classList.add('has-image');
			targetEl.textContent = letter;
			return;
		}

		targetEl.style.backgroundImage = '';
		targetEl.style.backgroundSize = '';
		targetEl.style.backgroundPosition = '';
		targetEl.style.backgroundRepeat = '';
		targetEl.classList.remove('has-image');
		targetEl.textContent = letter;
		targetEl.style.background = `linear-gradient(135deg, ${accent}, #ff7f8d)`;
	}

	function getFormData() {
		const formData = new FormData(form);
		const selectedInterests = Array.from(form.querySelectorAll('input[name="interests"]:checked'))
			.map((input) => input.value);
		const rawName = (formData.get('name') || '').toString().trim();
		const safeName = rawName || currentUser.name || 'Unknown';
		const rawLetter = (formData.get('avatarLetter') || '').toString().trim();

		return {
			name: safeName,
			age: (formData.get('age') || '').toString().trim(),
			status: ((formData.get('status') || '').toString().trim() || 'Ready to meet someone kind'),
			location: ((formData.get('location') || '').toString().trim() || 'Phnom Penh, KH'),
			bio: ((formData.get('bio') || '').toString().trim() || 'Tell people about your vibe and what kind of connection you want.'),
			interests: selectedInterests,
			isOnline: Boolean(formData.get('isOnline')),
			avatarLetter: (rawLetter || safeName.charAt(0) || 'H').toUpperCase(),
			accent: (formData.get('accent') || '#ff4d6d').toString(),
			banner: (formData.get('banner') || '#2b2d42').toString(),
			profileImage: profileData.profileImage || ''
		};
	}

	function renderPreview(data) {
		const agePart = data.age ? `, ${data.age}` : '';
		if (previewName) previewName.textContent = `${data.name}${agePart}`;
		if (previewHandle) previewHandle.textContent = `@heartsync-${slugifyName(data.name)}`;
		if (previewStatus) previewStatus.textContent = data.status;
		if (previewBio) previewBio.textContent = data.bio;
		if (previewLocation) previewLocation.textContent = data.location;

		if (previewBadge) {
			previewBadge.style.display = data.isOnline ? 'inline-flex' : 'none';
		}

		if (previewBanner) {
			previewBanner.style.background = `linear-gradient(135deg, ${data.banner}, #404663)`;
		}

		setAvatarVisual(previewAvatarCircle, data.profileImage, data.avatarLetter, data.accent);
		setAvatarVisual(previewCardAvatar, data.profileImage, data.avatarLetter, data.accent);

		if (previewInterests) {
			previewInterests.innerHTML = '';
			const interests = data.interests.length ? data.interests : ['Coffee', 'Music'];
			interests.forEach((interest) => {
				const chip = document.createElement('span');
				chip.textContent = interest;
				previewInterests.appendChild(chip);
			});
		}
	}

	function fillForm(data) {
		form.elements.name.value = data.name || '';
		form.elements.age.value = data.age || '';
		form.elements.status.value = data.status || '';
		form.elements.location.value = data.location || '';
		form.elements.bio.value = data.bio || '';
		form.elements.avatarLetter.value = data.avatarLetter || '';
		form.elements.accent.value = data.accent || '#ff4d6d';
		form.elements.banner.value = data.banner || '#2b2d42';
		form.elements.isOnline.checked = Boolean(data.isOnline);

		form.querySelectorAll('input[name="interests"]').forEach((input) => {
			input.checked = data.interests.includes(input.value);
		});
	}

	function setState(message, isError = false) {
		if (!saveState) {
			return;
		}
		saveState.textContent = message;
		saveState.style.color = isError ? '#d62839' : '#2f7a46';
	}

	function syncAccountName(name) {
		const users = readJSON(AUTH_USERS_KEY, []);
		const updatedUsers = users.map((user) => {
			if (user.email === currentUser.email) {
				return { ...user, name };
			}
			return user;
		});
		writeJSON(AUTH_USERS_KEY, updatedUsers);
	}

	fillForm(profileData);
	renderPreview(profileData);

	avatarPreviewRing?.addEventListener('click', () => {
		imageInput?.click();
	});

	form.addEventListener('input', () => {
		const liveData = getFormData();
		profileData = { ...profileData, ...liveData };
		renderPreview(profileData);
	});

	imageInput?.addEventListener('change', (event) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith('image/')) {
			setState('Please choose an image file.', true);
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
			profileData.profileImage = imageDataUrl;
			const liveData = { ...getFormData(), profileImage: imageDataUrl };
			renderPreview(liveData);
			setState('Profile picture selected. Save profile to keep it.');
		};
		reader.readAsDataURL(file);
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		profileData = { ...profileData, ...getFormData() };
		writeJSON(profileKey, profileData);
		syncAccountName(profileData.name);
		renderPreview(profileData);
		setState('Profile saved successfully.');
	});

	resetButton?.addEventListener('click', () => {
		profileData = defaultProfile();
		writeJSON(profileKey, profileData);
		fillForm(profileData);
		renderPreview(profileData);
		setState('Profile reset to defaults.');
	});
});
