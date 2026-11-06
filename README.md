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

Firebase web configuration values are included in the client bundle and are not secret. The repository secrets below are used to configure the deployment build, not to make these public web values confidential. Firestore security rules protect the data; never place private credentials in `VITE_FIREBASE_*`.

## GitHub Pages deployment

1. In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add the six secrets below, using the corresponding values from **Firebase Project settings → General → Your apps → SDK setup and configuration**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. Open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Push to the `master` branch to run the deployment workflow, or start **Deploy to GitHub Pages** manually from the repository’s **Actions** tab.
4. The site is published at `https://saravanajd.github.io/Timesheet/`. The `/Timesheet/` path is case-sensitive and must match the Vite base and PWA scope. Confirm that `saravanajd.github.io` is listed under Firebase **Authorized domains**.

The workflow installs with `npm ci`, runs `npm test`, builds with the repository secrets, and deploys the `dist` artifact. It uses GitHub Pages only; Firebase Hosting is not used.

## Install and offline use

The production site can be installed as a PWA from a supported browser. Firestore keeps previously loaded timesheet data in its persistent local cache; edits made offline are queued and sync when the connection returns. The service worker precaches only the app shell and static assets and is disabled during `npm run dev`.
