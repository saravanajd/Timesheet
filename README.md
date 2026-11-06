# Timesheet

Personal timesheet app built with React, TypeScript, Vite, Bootstrap, and Firebase Authentication and Firestore.

## Firebase setup

1. Create a Firebase project on the free Spark plan at [Firebase Console](https://console.firebase.google.com/).
2. In **Project settings → General**, register a Web app and note its six configuration values.
3. In **Authentication → Sign-in method**, enable both **Email/Password** and **Google**.
4. In **Authentication → Settings → Authorized domains**, add `saravanajd.github.io` (the hostname only) so Google sign-in works on `https://saravanajd.github.io/Timesheet/`.
5. Create a Cloud Firestore database. Open **Firestore Database → Rules**, replace the contents with [`firestore.rules`](./firestore.rules), and publish. These rules restrict each signed-in user to their own documents.

For local development, copy `.env.example` to `.env.local` and fill in the matching Firebase web app fields:

| Environment variable | Firebase config field |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Install dependencies and run locally with `npm ci` and `npm run dev`.

## Editing entries

Typing changes the local draft only, including spaces. Press **Enter** or leave the task input (click elsewhere or Tab away) to save; a typing pause does not save. Deleting a task or accepting an AI suggestion also commits that action. Hours are saved on Enter or blur. **Unsaved changes** means the draft has not yet been submitted. Commit an entry before closing or reloading the app.

## Optional AI wording

The optional **Enable AI wording** setting is off by default and is saved in the signed-in user's Firestore settings. To enable it:

1. In the [Firebase Console](https://console.firebase.google.com/), open **AI Logic** and enable Firebase AI Logic for the project.
2. Choose **Gemini Developer API** as the provider. No API key is added to the app or its environment files; the Firebase AI Logic SDK handles requests from the signed-in app.
3. Keep the Firebase project on the **Spark plan** without linking a Cloud Billing account. The selected model is `gemini-3.8-flash`, listed in the [Firebase AI Logic supported models](https://firebase.google.com/docs/ai-logic/models) as a non-preview Flash model that does not require billing. Availability and free-tier quotas are subject to Google's current documentation and limits.
4. Sign in, turn on **Enable AI wording**, and use the ✨ button on a task or press **Ctrl+I**. Only the selected task text is sent; suggestions are never saved unless accepted.

See [Firebase AI Logic pricing](https://firebase.google.com/docs/ai-logic/pricing) for provider-specific billing requirements. Do not upgrade this project to Blaze for this feature.

Firebase web configuration values are included in the client bundle and are not secret. The repository secrets below are used to configure the deployment build, not to make these public web values confidential. Firestore security rules protect the data; never place private credentials in `VITE_FIREBASE_*`.

## GitHub Pages deployment

1. In the GitHub repository, open **Settings → Secrets and variables → Actions**. Add the six names below as **Repository secrets** or under the **Variables** tab as **Repository variables**, using the corresponding values from **Firebase Project settings → General → Your apps → SDK setup and configuration**. Secrets take precedence when both exist:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. Open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Push to the `master` branch to run the deployment workflow, or start **Deploy to GitHub Pages** manually from the repository’s **Actions** tab.
4. The site is published at `https://saravanajd.github.io/Timesheet/`. The `/Timesheet/` path is case-sensitive and must match the Vite base and PWA scope. Confirm that `saravanajd.github.io` is listed under Firebase **Authorized domains**.

The workflow installs with `npm ci`, runs `npm test`, builds with the repository secrets or variables, and deploys the `dist` artifact. The build stops and lists missing Firebase variable names (never their values) if configuration is incomplete. Local `.env.local` values are not available to GitHub Actions. After changing repository configuration, run a new deployment; it cannot change an already-built site. It uses GitHub Pages only; Firebase Hosting is not used.

## Install and offline use

The production site can be installed as a PWA from a supported browser. Firestore keeps previously loaded timesheet data in its persistent local cache; edits made offline are queued and sync when the connection returns. The service worker precaches only the app shell and static assets and is disabled during `npm run dev`.
