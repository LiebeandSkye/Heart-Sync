# HeartSync Public App

This project is currently deployed from `public/` through Firebase Hosting.

## Folder shape

- `public/` is the hosting root. Everything inside it is publishable static output.
- `public/frontend/` is only an organization folder for browser route shells like `home_page.html` and `login_page.html`.
- `public/frontend/components/` contains the actual feature markup, CSS, and JavaScript loaded into each shell.
- `public/function/` contains shared browser runtime helpers such as `loadHTML.js`, Firebase bootstrap, and state helpers.
- The root `backend/` folder can still become your Render service later, but it is not part of the static site that Firebase serves from `public/`.

You do not strictly need a `frontend/` folder for deployment. It exists so the route shells stay separate from shared runtime files and assets. Firebase Hosting will still publish the full `public/` tree either way.

## Firebase setup

1. Put your Firebase web config in `public/function/firebaseConfig.js` by replacing `null`.
2. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

3. Deploy hosting when ready:

```bash
firebase deploy --only hosting
```

## Auth flow

- `public/frontend/login_page.html` loads the login component.
- Email/password and anonymous sign-in are both supported in `public/frontend/components/login/login.js`.
- App pages (`home`, `about`, `profile`, `connection`) call `requireAuth()` before loading their components.

## Realtime chat now

- Global chat is already modeled as Firestore realtime messages under `rooms/global/messages`.
- Direct chat is modeled under `threads/{threadId}/messages`.
- Current direct thread ids are deterministic using the current Firebase user uid plus the selected profile id.

That means direct chat is now structurally ready for realtime, but your current discovery cards are still sample profiles. For true user-to-user chat, the next step is to load real user profiles from Firestore and use the other user's uid instead of a sample profile id.

## Render note

If you host an API or admin backend on Render later, keep it separate from `public/`. The static frontend can still stay on Firebase Hosting while Render handles server-only work like webhooks, moderation, email, or privileged admin actions.
