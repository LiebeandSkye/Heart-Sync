Firebase setup (quickstart for HeartSync prototype)

1) Create a Firebase project
   - Go to https://console.firebase.google.com/
   - Create a new project (name it HeartSync-dev or similar)

2) Add a Web App and copy config
   - In Project settings → Your apps → Add app (Web)
   - Copy the config object (apiKey, authDomain, projectId, appId, etc.)

3) Enable Authentication
   - Authentication → Sign-in method → enable "Anonymous" (for prototype)

4) Create Firestore
   - Build → Firestore Database → Create database
   - Start in test mode for local development (adjust rules before production)

5) Wire the config into the prototype
   Option A (recommended): in your local dev HTML before any module import, add a small inline script in the top-level page(s):

   <script>
     window.HEARTSYNC_FIREBASE_CONFIG = {
       apiKey: "...",
       authDomain: "...",
       projectId: "...",
       storageBucket: "...",
       messagingSenderId: "...",
       appId: "..."
     };
   </script>

   Option B: paste the config directly into `frontend/src/firebase/firebase.js` by replacing the AUTO_CONFIG usage.

6) Run and test
   - Open the pages in a static server (or open the HTML files in the browser). The scripts use the modular CDN SDK and will attempt anonymous sign-in.
   - On the Profile page: after saving, the UI will attempt to write to `/profiles/{uid}` in Firestore.
   - On Connection page: the prototype will attempt to listen/write to `/rooms/global/messages` and `/threads/{threadId}/messages`.

7) Dev notes & security
   - Test mode Firestore rules are permissive; lock them down before real deployments.
   - This prototype uses anonymous auth for convenience. For real apps, add proper sign-up/sign-in flows and security rules tied to `request.auth.uid`.
