# Project: Timesheet
Personal timesheet app. React + TypeScript + Vite, Bootstrap 5, Firebase Auth + Firestore, GitHub Pages.
Follow docs/Timesheet-development-plan.md for the development plan. The approved UI and behaviour are in
docs/timesheet-entry.html. Match it; do not redesign.

## Rules
- Work one phase at a time. Do not start the next phase. Stop and summarise when a phase is done.
- TypeScript strict mode. No `any`. Functional components and hooks only.
- Firebase modular SDK only. Config comes from VITE_FIREBASE_* env vars. Never commit secrets.
- Never use localStorage for timesheet data. Firestore is the source of truth.
- Dates: the date key is "yyyy-MM-dd". The workday date logic lives only in src/lib/workday.ts
  (the date key is the calendar date in America/Chicago, never the device's local date; there is no custom rollover hour).
  Do not call `new Date()` elsewhere to decide "today".
- Hours are never typed by default: displayHours = override ?? (hasTasks ? autoHours : 0). Logic lives in src/lib/hours.ts.
- Keep components small. Put pure logic in src/lib and cover it with Vitest tests.
- Task inputs are controlled auto-growing textareas. Keyboard behaviour must match the prototype
  (Enter, Backspace on empty, Ctrl+Delete, arrow navigation). Manage focus with refs, not by re-querying the DOM.
- Free-only: GitHub Pages hosting, Firebase Spark plan, Auth + Firestore only. No Cloud Storage, no Cloud Functions, no Firebase Hosting, no paid services.
- Only the current and previous month are ever loaded or navigable. Clamp ranges in src/lib/workday.ts (`minKey`, `maxKey`).
- One realtime listener per visible range; unsubscribe on view change. Debounce writes.
- Do not add libraries without asking. Keep the UI minimal and fast.
- After each phase run `npm run build` and `npm test` and fix errors before reporting done.