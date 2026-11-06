# Timesheet

Personal timesheet app built with React, TypeScript, Vite, Bootstrap, and Firebase Authentication and Firestore.

## Firebase setup

1. Create a Firebase project on the free Spark plan at [Firebase Console](https://console.firebase.google.com/).
2. In **Project settings → General**, add a web app and copy its Firebase configuration values.
3. In **Authentication → Sign-in method**, enable the Google provider.
4. In **Authentication → Settings → Authorized domains**, add `saravanajd.github.io` for the GitHub Pages site.
5. Create a Cloud Firestore database. In **Firestore Database → Rules**, paste the contents of [`firestore.rules`](./firestore.rules) and publish the rules. They allow each signed-in user to access only their own documents.
6. Copy `.env.example` to `.env.local` and fill in the values from the Firebase web app configuration:

   | Environment variable | Firebase config field |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

7. Install dependencies and start the app with `npm install` and `npm run dev`.

Firebase web configuration values are included in the client bundle and are not secrets. Never put private credentials in these variables; Firestore security rules protect users' data.
