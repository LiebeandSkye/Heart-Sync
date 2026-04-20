import { initFirebase, loadProfileFromFirestore, saveProfileToFirestore } from '../../firebase/firebase.js';

const PROFILE_STORAGE_KEY = 'heartsync.profile';

const defaultProfile = {
    name: 'Sophie',
    age: '24',
    status: 'Ready to meet someone kind',
    location: 'Phnom Penh, KH',
    bio: 'I like unplanned coffee runs, voice notes at midnight, and people who make everyday life feel lighter.',
    accent: '#ff4d6d',
    banner: '#2b2d42',
    avatarLetter: 'S',
    interests: ['Coffee', 'Travel', 'Music'],
    isOnline: true,
};

const form = document.getElementById('profileForm');
const saveState = document.getElementById('saveState');
const resetButton = document.getElementById('resetProfile');

const preview = {
    banner: document.getElementById('previewBanner'),
    avatar: document.getElementById('previewAvatar'),
    name: document.getElementById('previewName'),
    handle: document.getElementById('previewHandle'),
    badge: document.getElementById('previewBadge'),
    status: document.getElementById('previewStatus'),
    bio: document.getElementById('previewBio'),
    location: document.getElementById('previewLocation'),
    interests: document.getElementById('previewInterests'),
};

function loadProfile() {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!stored) {
        return { ...defaultProfile };
    }

    try {
        return { ...defaultProfile, ...JSON.parse(stored) };
    } catch {
        return { ...defaultProfile };
    }
}

function saveProfile(profile) {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function profileToHandle(name) {
    return `@heartsync-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'member'}`;
}

function readFormState() {
    const data = new FormData(form);
    const interests = Array.from(form.querySelectorAll('input[name="interests"]:checked')).map((input) => input.value);

    return {
        name: (data.get('name') || '').toString().trim() || defaultProfile.name,
        age: (data.get('age') || '').toString().trim() || defaultProfile.age,
        status: (data.get('status') || '').toString().trim() || defaultProfile.status,
        location: (data.get('location') || '').toString().trim() || defaultProfile.location,
        bio: (data.get('bio') || '').toString().trim() || defaultProfile.bio,
        accent: (data.get('accent') || defaultProfile.accent).toString(),
        banner: (data.get('banner') || defaultProfile.banner).toString(),
        avatarLetter: ((data.get('avatarLetter') || '').toString().trim().charAt(0) || defaultProfile.avatarLetter).toUpperCase(),
        interests: interests.length ? interests : defaultProfile.interests,
        isOnline: form.elements.isOnline.checked,
    };
}

function fillForm(profile) {
    form.elements.name.value = profile.name;
    form.elements.age.value = profile.age;
    form.elements.status.value = profile.status;
    form.elements.location.value = profile.location;
    form.elements.bio.value = profile.bio;
    form.elements.accent.value = profile.accent;
    form.elements.banner.value = profile.banner;
    form.elements.avatarLetter.value = profile.avatarLetter;
    form.elements.isOnline.checked = profile.isOnline;

    const selected = new Set(profile.interests);
    form.querySelectorAll('input[name="interests"]').forEach((input) => {
        input.checked = selected.has(input.value);
    });
}

function renderProfile(profile) {
    preview.banner.style.background = `linear-gradient(135deg, ${profile.banner}, ${profile.accent})`;
    preview.avatar.style.background = `linear-gradient(135deg, ${profile.accent}, ${profile.banner})`;
    preview.name.textContent = `${profile.name}, ${profile.age}`;
    preview.handle.textContent = profileToHandle(profile.name);
    preview.avatar.textContent = profile.avatarLetter;
    preview.status.textContent = profile.status;
    preview.bio.textContent = profile.bio;
    preview.location.textContent = profile.location;
    preview.badge.hidden = !profile.isOnline;

    preview.interests.innerHTML = '';
    profile.interests.forEach((interest) => {
        const tag = document.createElement('span');
        tag.textContent = interest;
        preview.interests.appendChild(tag);
    });
}

function setSaveState(message) {
    saveState.textContent = message;
}

function hydrate() {
    const profile = loadProfile();
    fillForm(profile);
    renderProfile(profile);
    setSaveState('Saved locally on this browser.');
}

form.addEventListener('input', () => {
    renderProfile(readFormState());
    setSaveState('Unsaved changes');
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const profile = readFormState();
    saveProfile(profile);
    renderProfile(profile);
    setSaveState('Profile saved locally.');

    try {
        const user = await initFirebase();
        if (user) {
            await saveProfileToFirestore(profile);
            setSaveState('Profile saved to Firestore.');
        }
    } catch (e) {
        console.warn('Firestore save failed', e);
    }
});

resetButton.addEventListener('click', () => {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    hydrate();
});

hydrate();

// Try to initialize Firebase (if user provided config) and hydrate from Firestore
initFirebase().then(async (user) => {
    if (!user) return;
    try {
        const remote = await loadProfileFromFirestore(user.uid);
        if (remote) {
            fillForm(remote);
            renderProfile(remote);
            setSaveState('Profile loaded from Firestore.');
        }
    } catch (e) {
        console.warn('Failed to load profile from Firestore', e);
    }
});