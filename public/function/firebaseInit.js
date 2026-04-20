(function () {
    window.App = window.App || {};
    const config = window.HEARTSYNC_FIREBASE_CONFIG;
    const hasFirebase = typeof window.firebase !== 'undefined';

    function createNoopFirebase() {
        const resolved = Promise.resolve(null);
        return {
            app: null,
            auth: null,
            db: null,
            onAuthReady() { return resolved; },
            requireAuth() { return resolved; },
            redirectIfAuthenticated() { return resolved; },
            signInAnonymous() { return Promise.reject(new Error('Firebase is not configured')); },
            signInEmail() { return Promise.reject(new Error('Firebase is not configured')); },
            registerEmail() { return Promise.reject(new Error('Firebase is not configured')); },
            signOutUser() { return Promise.resolve(); },
            currentUser() { return null; },
            saveProfileToFirestore() { return Promise.reject(new Error('Firebase is not configured')); },
            loadProfileFromFirestore() { return Promise.resolve(null); },
            listenToGlobalMessages() { return function noop() {}; },
            sendGlobalMessage() { return Promise.reject(new Error('Firebase is not configured')); },
            listenToThread() { return function noop() {}; },
            sendThreadMessage() { return Promise.reject(new Error('Firebase is not configured')); },
            buildDirectThreadId(profileId) { return `dm_demo__${String(profileId)}`; },
        };
    }

    if (!hasFirebase || !config) {
        window.App.firebase = createNoopFirebase();
        return;
    }

    const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    const serverTimestamp = window.firebase.firestore.FieldValue.serverTimestamp;

    let authResolved = false;
    let authResolve = null;
    const authReady = new Promise((resolve) => {
        authResolve = resolve;
    });

    auth.onAuthStateChanged((user) => {
        if (!authResolved) {
            authResolved = true;
            authResolve(user || null);
        }

        if (window.AppHooks && typeof window.AppHooks.run === 'function') {
            window.AppHooks.run('authChanged', user || null);
        }
    });

    function currentUser() { return auth.currentUser; }
    async function onAuthReady() { return authReady; }

    async function requireAuth(redirectTo = './login_page.html') {
        const user = await authReady;
        if (!user) { window.location.href = redirectTo; return null; }
        return user;
    }

    async function redirectIfAuthenticated(target = './home_page.html') {
        const user = await authReady;
        if (user) window.location.href = target;
        return user;
    }

    function signInAnonymous() { return auth.signInAnonymously(); }
    function signInEmail(email, password) { return auth.signInWithEmailAndPassword(email, password); }
    function registerEmail(email, password) { return auth.createUserWithEmailAndPassword(email, password); }
    function signOutUser() { return auth.signOut(); }
    function profileDocRef(uid) { return db.collection('profiles').doc(uid); }

    async function saveProfileToFirestore(profile) {
        const user = currentUser();
        if (!user) throw new Error('Not authenticated');

        await profileDocRef(user.uid).set({
            ...profile,
            uid: user.uid,
            email: user.email || null,
            isAnonymous: !!user.isAnonymous,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    }

    async function loadProfileFromFirestore() {
        const user = currentUser();
        if (!user) return null;
        const snapshot = await profileDocRef(user.uid).get();
        return snapshot.exists ? snapshot.data() : null;
    }

    function globalCollection() { return db.collection('rooms').doc('global').collection('messages'); }

    function buildDirectThreadId(profileId) {
        const user = currentUser();
        const selfId = user ? user.uid : 'guest';
        return ['dm', selfId, String(profileId)].sort().join('__');
    }

    function listenToGlobalMessages(onUpdate) {
        return globalCollection().orderBy('createdAt', 'asc').onSnapshot((snapshot) => {
            const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            onUpdate(messages);
        });
    }

    function sendGlobalMessage(payload) {
        const user = currentUser();
        if (!user) return Promise.reject(new Error('Not authenticated'));

        return globalCollection().add({
            ...payload,
            uid: user.uid,
            createdAt: serverTimestamp(),
        });
    }

    function threadCollection(threadId) { return db.collection('threads').doc(threadId).collection('messages'); }

    function listenToThread(threadId, onUpdate) {
        return threadCollection(threadId).orderBy('createdAt', 'asc').onSnapshot((snapshot) => {
            const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            onUpdate(messages);
        });
    }

    function sendThreadMessage(threadId, payload) {
        const user = currentUser();
        if (!user) return Promise.reject(new Error('Not authenticated'));

        return threadCollection(threadId).add({
            ...payload,
            uid: user.uid,
            createdAt: serverTimestamp(),
        });
    }

    window.App.firebase = {
        app,
        auth,
        db,
        onAuthReady,
        requireAuth,
        redirectIfAuthenticated,
        signInAnonymous,
        signInEmail,
        registerEmail,
        signOutUser,
        currentUser,
        saveProfileToFirestore,
        loadProfileFromFirestore,
        listenToGlobalMessages,
        sendGlobalMessage,
        listenToThread,
        sendThreadMessage,
        buildDirectThreadId,
    };
})();
