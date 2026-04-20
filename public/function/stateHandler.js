(function () {
    window.AppState = window.AppState || {};

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

    const globalKey = 'heartsync.chat.global';
    const dmPrefix = 'heartsync.chat.dm.';

    window.AppState.profile = { ...defaultProfile };
    window.AppState.messages = {
        [globalKey]: [],
    };

    window.AppState.defaultProfile = function defaultProfileFactory() {
        return { ...defaultProfile };
    };

    window.AppState.loadUserProfile = function loadUserProfile() {
        return { ...defaultProfile, ...window.AppState.profile };
    };

    window.AppState.saveUserProfile = async function saveUserProfile(profile) {
        window.AppState.profile = { ...defaultProfile, ...profile };

        if (window.AppHooks && typeof window.AppHooks.run === 'function') {
            window.AppHooks.run('profileLoaded', window.AppState.loadUserProfile());
        }

        if (window.App && window.App.firebase && typeof window.App.firebase.saveProfileToFirestore === 'function') {
            await window.App.firebase.saveProfileToFirestore(window.AppState.profile);
        }

        if (window.AppHooks && typeof window.AppHooks.run === 'function') {
            window.AppHooks.run('profileSaved', window.AppState.loadUserProfile());
        }
    };

    window.AppState.resetUserProfile = async function resetUserProfile() {
        await window.AppState.saveUserProfile(defaultProfile);
    };

    window.AppState.hydrateUserProfile = async function hydrateUserProfile() {
        if (!(window.App && window.App.firebase && typeof window.App.firebase.loadProfileFromFirestore === 'function')) {
            return window.AppState.loadUserProfile();
        }

        const remote = await window.App.firebase.loadProfileFromFirestore();
        if (remote) {
            window.AppState.profile = { ...defaultProfile, ...remote };
        }

        if (window.AppHooks && typeof window.AppHooks.run === 'function') {
            window.AppHooks.run('profileLoaded', window.AppState.loadUserProfile());
        }

        return window.AppState.loadUserProfile();
    };

    window.AppState.loadMessages = function loadMessages(key, fallback = []) {
        return window.AppState.messages[key] ? [...window.AppState.messages[key]] : [...fallback];
    };

    window.AppState.saveMessages = function saveMessages(key, messages) {
        window.AppState.messages[key] = [...messages];
    };

    window.AppState.clearThreadMessages = function clearThreadMessages(threadId) {
        window.AppState.messages[`${dmPrefix}${threadId}`] = [];
    };

    window.AppState.appendGlobalMessage = async function appendGlobalMessage(message) {
        const current = window.AppState.loadMessages(globalKey, []);
        const next = [...current, message];
        window.AppState.saveMessages(globalKey, next);

        if (window.App && window.App.firebase && typeof window.App.firebase.sendGlobalMessage === 'function') {
            await window.App.firebase.sendGlobalMessage({ author: message.author, text: message.text });
        }
    };

    window.AppState.appendThreadMessage = async function appendThreadMessage(threadId, message) {
        const key = `${dmPrefix}${threadId}`;
        const current = window.AppState.loadMessages(key, []);
        const next = [...current, message];
        window.AppState.saveMessages(key, next);

        if (window.App && window.App.firebase && typeof window.App.firebase.sendThreadMessage === 'function') {
            const firestoreThreadId = window.App.firebase.buildDirectThreadId(threadId);
            await window.App.firebase.sendThreadMessage(firestoreThreadId, { author: message.author, text: message.text });
        }
    };

    if (window.App && window.App.firebase && typeof window.App.firebase.onAuthReady === 'function') {
        window.App.firebase.onAuthReady().then((user) => {
            if (!user) {
                return;
            }

            window.AppState.hydrateUserProfile().catch((error) => {
                console.warn('Failed to hydrate profile from Firestore', error);
            });
        });
    }
})();
