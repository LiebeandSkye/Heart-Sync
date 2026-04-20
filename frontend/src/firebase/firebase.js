// Firebase initializer and light Firestore helpers for HeartSync prototype
// Usage: set window.HEARTSYNC_FIREBASE_CONFIG = { apiKey: '...', projectId: '...', ... }
// before importing this module, or call initFirebase(config) with your config.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export let app = null;
export let auth = null;
export let db = null;
export let currentUser = null;
export let ready = null;

const AUTO_CONFIG = window.HEARTSYNC_FIREBASE_CONFIG || null;

export async function initFirebase(config = AUTO_CONFIG) {
  if (app) return ready;
  if (!config) {
    console.warn('Firebase config not provided — skipping init. See firebase-setup.md');
    return null;
  }

  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);

  ready = new Promise((resolve) => {
    onAuthStateChanged(auth, (u) => {
      currentUser = u;
      if (u) resolve(u);
    });
  });

  // Attempt anonymous sign-in so prototypes can use a stable uid
  signInAnonymously(auth).catch((e) => {
    console.warn('Anonymous sign-in failed:', e);
  });

  return ready;
}

export async function saveProfileToFirestore(profile) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser) throw new Error('Not signed in');
  await setDoc(doc(db, 'profiles', currentUser.uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export async function loadProfileFromFirestore(uid) {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'profiles', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function listenToGlobalMessages(onUpdate) {
  if (!db) {
    console.warn('listenToGlobalMessages: Firestore not initialized');
    return () => {};
  }
  const q = query(collection(db, 'rooms', 'global', 'messages'), orderBy('createdAt'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onUpdate(messages);
  });
}

export async function sendGlobalMessage(payload) {
  if (!db) throw new Error('Firestore not initialized');
  await addDoc(collection(db, 'rooms', 'global', 'messages'), { ...payload, createdAt: serverTimestamp() });
}

export function listenToThread(threadId, onUpdate) {
  if (!db) {
    console.warn('listenToThread: Firestore not initialized');
    return () => {};
  }
  const q = query(collection(db, 'threads', threadId, 'messages'), orderBy('createdAt'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onUpdate(messages);
  });
}

export async function sendThreadMessage(threadId, payload) {
  if (!db) throw new Error('Firestore not initialized');
  await addDoc(collection(db, 'threads', threadId, 'messages'), { ...payload, createdAt: serverTimestamp() });
}
