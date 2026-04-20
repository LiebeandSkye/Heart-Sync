import { initFirebase, listenToGlobalMessages, sendGlobalMessage, sendThreadMessage, currentUser } from '../../firebase/firebase.js';

const PROFILE_STORAGE_KEY = 'heartsync.profile';
const GLOBAL_CHAT_KEY = 'heartsync.chat.global';
const DM_CHAT_PREFIX = 'heartsync.chat.dm.';

const fallbackViewer = {
    name: 'You',
    age: '24',
    location: 'Phnom Penh, KH',
    status: 'Open to meaningful conversations',
    interests: ['Coffee', 'Travel', 'Music'],
};

const sampleProfiles = [
    {
        id: 'nina',
        name: 'Nina',
        age: 23,
        location: 'Bangkok, TH',
        status: 'Soft spot for bookstores and rooftop noodles',
        bio: 'Looking for someone curious, affectionate, and funny enough to survive long voice notes.',
        interests: ['Books', 'Travel', 'Late Night Talks'],
        gradientA: '#ff8da1',
        gradientB: '#ffb46b',
    },
    {
        id: 'kai',
        name: 'Kai',
        age: 26,
        location: 'Singapore, SG',
        status: 'Gym mornings, ramen nights, direct energy',
        bio: 'I am into consistency, gentle confidence, and people who can laugh at themselves.',
        interests: ['Fitness', 'Movies', 'Music'],
        gradientA: '#ff6b9d',
        gradientB: '#8f8cff',
    },
    {
        id: 'amira',
        name: 'Amira',
        age: 25,
        location: 'Jakarta, ID',
        status: 'Designer heart, chaotic playlist, calm presence',
        bio: 'I want chemistry that feels easy and a chat that never turns into an interview.',
        interests: ['Art', 'Coffee', 'Gaming'],
        gradientA: '#ff9ac1',
        gradientB: '#ffc46b',
    },
    {
        id: 'leo',
        name: 'Leo',
        age: 27,
        location: 'Kuala Lumpur, MY',
        status: 'Night drives and real talks over fake flexing',
        bio: 'I am happiest when the conversation is honest, the food is good, and the plan is spontaneous.',
        interests: ['Travel', 'Movies', 'Coffee'],
        gradientA: '#ff7f8d',
        gradientB: '#ffd06b',
    },
];

const profileGrid = document.getElementById('profileGrid');
const viewerChip = document.getElementById('viewerChip');
const globalFeed = document.getElementById('globalFeed');
const globalChatForm = document.getElementById('globalChatForm');
const dmFeed = document.getElementById('dmFeed');
const dmForm = document.getElementById('dmForm');
const dmTitle = document.getElementById('dmTitle');
const clearThreadButton = document.getElementById('clearThread');
const openGlobalChatButton = document.getElementById('openGlobalChat');
const openDirectChatButton = document.getElementById('openDirectChat');
const directLauncherLabel = document.getElementById('directLauncherLabel');
const globalChatPanel = document.getElementById('globalChatPanel');
const directChatPanel = document.getElementById('directChatPanel');
const closePanelButtons = document.querySelectorAll('.panel-close');

let activeProfileId = null;

function readStoredProfile() {
    try {
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        return raw ? { ...fallbackViewer, ...JSON.parse(raw) } : { ...fallbackViewer };
    } catch {
        return { ...fallbackViewer };
    }
}

function loadMessages(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveMessages(key, messages) {
    window.localStorage.setItem(key, JSON.stringify(messages));
}

function timeLabel() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getViewer() {
    return readStoredProfile();
}

function computeMatch(profile) {
    const viewer = getViewer();
    const viewerAge = Number.parseInt(viewer.age, 10) || 24;
    const viewerInterests = Array.isArray(viewer.interests) ? viewer.interests : [];
    const sharedInterests = profile.interests.filter((interest) => viewerInterests.includes(interest));
    const unionSize = new Set([...profile.interests, ...viewerInterests]).size || 1;
    const interestScore = sharedInterests.length / unionSize;
    const ageDifference = Math.abs(viewerAge - profile.age);
    const ageScore = Math.max(0, 1 - ageDifference / 12);
    const sameRegionBonus = viewer.location.split(',').pop()?.trim() === profile.location.split(',').pop()?.trim() ? 2 : 0;
    const score = 62 + interestScore * 24 + ageScore * 12 + sameRegionBonus;
    return Math.max(60, Math.min(98, Math.round(score)));
}

function directChatKey(profileId) {
    return `${DM_CHAT_PREFIX}${profileId}`;
}

function renderViewerChip() {
    const viewer = getViewer();
    viewerChip.textContent = `${viewer.name}, ${viewer.age} · ${viewer.location}`;
}

function setPanelOpen(panelName, isOpen) {
    const panel = panelName === 'global' ? globalChatPanel : directChatPanel;
    const siblingPanel = panelName === 'global' ? directChatPanel : globalChatPanel;

    if (isOpen) {
        siblingPanel.classList.remove('active');
        siblingPanel.setAttribute('aria-hidden', 'true');
    }

    panel.classList.toggle('active', isOpen);
    panel.setAttribute('aria-hidden', String(!isOpen));

    const anyOpen = globalChatPanel.classList.contains('active') || directChatPanel.classList.contains('active');
    document.body.classList.toggle('panel-open', anyOpen);
}

function syncDirectLauncher() {
    const activeProfile = getActiveProfile();
    directLauncherLabel.textContent = activeProfile ? activeProfile.name : 'Messages';
}

function buildProfileCard(profile) {
    const card = document.createElement('article');
    const match = computeMatch(profile);
    card.className = `profile-card${activeProfileId === profile.id ? ' active' : ''}`;
    card.innerHTML = `
    <div class="profile-cover" style="background: linear-gradient(135deg, ${profile.gradientA}, ${profile.gradientB});"></div>
    <div class="profile-top">
      <div>
        <h2 class="profile-name">${escapeHtml(profile.name)}, ${profile.age}</h2>
        <p class="profile-status">${escapeHtml(profile.status)}</p>
      </div>
      <span class="match-score">${match}% match</span>
    </div>
    <p class="profile-bio">${escapeHtml(profile.bio)}</p>
    <div class="meta-row">
      <span>${escapeHtml(profile.location)}</span>
      <span>Open to chat</span>
    </div>
    <div class="tag-list">${profile.interests.map((interest) => `<span>${escapeHtml(interest)}</span>`).join('')}</div>
    <div class="card-actions">
      <button type="button" class="secondary-button" data-action="wave">Wave</button>
      <button type="button" class="primary-button" data-action="message">Message</button>
    </div>
  `;

    card.querySelector('[data-action="wave"]').addEventListener('click', () => {
        appendDirectMessage(profile.id, {
            author: getViewer().name,
            text: `Sent a wave to ${profile.name}.`,
            time: timeLabel(),
            self: true,
            system: true,
        });
        openDirectChat(profile.id);
    });

    card.querySelector('[data-action="message"]').addEventListener('click', () => {
        openDirectChat(profile.id);
    });

    return card;
}

function renderProfileGrid() {
    profileGrid.innerHTML = '';
    sampleProfiles.forEach((profile) => {
        profileGrid.appendChild(buildProfileCard(profile));
    });
}

function renderMessages(feed, messages, emptyMessage) {
    feed.innerHTML = '';

    if (!messages.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = emptyMessage;
        feed.appendChild(empty);
        return;
    }

    messages.forEach((message) => {
        const item = document.createElement('article');
        item.className = `message${message.self ? ' self' : ''}`;
        item.innerHTML = `
      <div class="message-head">
        <strong>${escapeHtml(message.author)}</strong>
        <span>${escapeHtml(message.time)}</span>
      </div>
      <div class="message-body">${escapeHtml(message.text)}</div>
    `;
        feed.appendChild(item);
    });

    feed.scrollTop = feed.scrollHeight;
}

function defaultGlobalMessages() {
    return [
        { author: 'HeartSync Bot', text: 'Welcome to the lounge. Keep it kind and keep it real.', time: '09:00 AM', self: false },
        { author: 'Nina', text: 'Anyone here into bookstore dates?', time: '09:03 AM', self: false },
    ];
}

function renderGlobalChat() {
    const messages = loadMessages(GLOBAL_CHAT_KEY, defaultGlobalMessages());
    renderMessages(globalFeed, messages, 'The lounge is quiet right now. Start the first message.');
}

function appendGlobalMessage(message) {
    const messages = loadMessages(GLOBAL_CHAT_KEY, defaultGlobalMessages());
    messages.push(message);
    saveMessages(GLOBAL_CHAT_KEY, messages);
    renderGlobalChat();
    // Best-effort: also write to Firestore if available
    try {
        sendGlobalMessage({ author: message.author, text: message.text, uid: currentUser?.uid || null }).catch(() => {});
    } catch (e) {
        /* ignore */
    }
}

function getActiveProfile() {
    return sampleProfiles.find((profile) => profile.id === activeProfileId) || null;
}

function renderDirectChat() {
    const profile = getActiveProfile();

    if (!profile) {
        dmTitle.textContent = 'Pick a profile to start';
        dmForm.elements.message.disabled = true;
        dmForm.querySelector('button').disabled = true;
        renderMessages(dmFeed, [], 'Choose a card and press Message to open a local thread.');
        syncDirectLauncher();
        return;
    }

    dmTitle.textContent = `Chat with ${profile.name}`;
    dmForm.elements.message.disabled = false;
    dmForm.querySelector('button').disabled = false;

    const fallbackMessages = [
        { author: profile.name, text: `Hey, I noticed we both like ${profile.interests[0].toLowerCase()}.`, time: '08:45 PM', self: false },
    ];
    const messages = loadMessages(directChatKey(profile.id), fallbackMessages);
    renderMessages(dmFeed, messages, `No messages with ${profile.name} yet.`);
    syncDirectLauncher();
}

function appendDirectMessage(profileId, message) {
    const profile = sampleProfiles.find((entry) => entry.id === profileId);
    if (!profile) {
        return;
    }

    const fallbackMessages = [
        { author: profile.name, text: `Hey, I noticed we both like ${profile.interests[0].toLowerCase()}.`, time: '08:45 PM', self: false },
    ];
    const messages = loadMessages(directChatKey(profile.id), fallbackMessages);
    messages.push(message);
    saveMessages(directChatKey(profile.id), messages);

    if (activeProfileId === profileId) {
        renderDirectChat();
    }

    // Best-effort: also write to Firestore thread (threadId uses profile id as prototype key)
    try {
        const threadId = `dm_${profile.id}`;
        sendThreadMessage(threadId, { author: message.author, text: message.text, uid: currentUser?.uid || null }).catch(() => {});
    } catch (e) {
        /* ignore */
    }
}

function openDirectChat(profileId) {
    activeProfileId = profileId;
    renderProfileGrid();
    renderDirectChat();
    setPanelOpen('direct', true);
}

openGlobalChatButton.addEventListener('click', () => {
    setPanelOpen('global', true);
});

openDirectChatButton.addEventListener('click', () => {
    setPanelOpen('direct', true);
});

closePanelButtons.forEach((button) => {
    button.addEventListener('click', () => {
        setPanelOpen(button.dataset.panel, false);
    });
});

[globalChatPanel, directChatPanel].forEach((panel) => {
    panel.addEventListener('click', (event) => {
        if (event.target === panel) {
            setPanelOpen(panel === globalChatPanel ? 'global' : 'direct', false);
        }
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        setPanelOpen('global', false);
        setPanelOpen('direct', false);
    }
});

globalChatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = globalChatForm.elements.message;
    const text = input.value.trim();
    if (!text) {
        return;
    }

    appendGlobalMessage({
        author: getViewer().name,
        text,
        time: timeLabel(),
        self: true,
    });

    input.value = '';
});

dmForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!activeProfileId) {
        return;
    }

    const input = dmForm.elements.message;
    const text = input.value.trim();
    if (!text) {
        return;
    }

    appendDirectMessage(activeProfileId, {
        author: getViewer().name,
        text,
        time: timeLabel(),
        self: true,
    });

    input.value = '';
});

clearThreadButton.addEventListener('click', () => {
    if (!activeProfileId) {
        return;
    }

    window.localStorage.removeItem(directChatKey(activeProfileId));
    renderDirectChat();
});

// Try to initialize Firebase and attach realtime listeners for the global room
initFirebase().then((user) => {
    if (!user) return;
    try {
        const unsubGlobal = listenToGlobalMessages((messages) => {
            const mapped = messages.map((m) => ({
                author: m.author || 'Unknown',
                text: m.text || '',
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                self: m.uid === currentUser?.uid,
            }));
            renderMessages(globalFeed, mapped, 'The lounge is quiet right now. Start the first message.');
        });
        window.__fsUnsubGlobal = unsubGlobal;
    } catch (e) {
        console.warn('Firestore global listener failed', e);
    }
}).catch(() => {});

renderViewerChip();
renderProfileGrid();
renderGlobalChat();
renderDirectChat();
syncDirectLauncher();