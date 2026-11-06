# Timesheet: Development Plan for the AI Agent

Personal timesheet web app. React + TypeScript + Vite, Firebase (Auth + Firestore), hosted on GitHub Pages.
Reference prototype: `docs/prototype.html` (the approved design and behaviour; copy it into the repo and tell the agent to match it).

---

## 1. Product summary

- One user (me). Each month I send a list of tasks per day plus the **total hours for that day**. There are no per-task hours and no project, start or end fields.
- Default screen is **Day view**: only the current day, cursor already in the task list.
- **Week** and **Month** views are for review and copying. Saturday and Sunday are highlighted (usually a day off).
- Hours are **automatic**: a day with at least one non-empty task gets the default daily hours (setting, default 9). A day with no tasks has 0. I can click the hours number to override it; clearing it goes back to auto.
- I work about 4:30 PM to 1:30 AM in my own local time (India), which is roughly 5:00 AM to 2:00 PM US Central (6:00 AM to 3:00 PM during daylight saving). Because the whole shift falls on one US Central calendar date, **the timesheet date is simply today's calendar date in `America/Chicago`**. There is no custom rollover hour. Entering tasks at 5 PM my time and at 1 AM my time the next day both land on the same sheet, and the date changes at US Central midnight, which is about 11:30 AM my time, well before the next shift.
- Never use the device's local date to decide the timesheet date. Always convert with the `America/Chicago` time zone (date-fns-tz), so daylight saving changes are handled automatically.
- Note: the prototype's "today" logic uses a 4 PM rollover on the device clock. Ignore that part; follow this plan for date logic.

## 2. Tech stack

React 18, TypeScript, Vite, Bootstrap 5 (utilities and layout only; the look follows the prototype), Firebase v10+ modular SDK (Auth with Google sign-in, Firestore), date-fns and date-fns-tz, ExcelJS (later phase), Vitest, GitHub Pages with GitHub Actions.

### Free-only rules (personal use, zero cost)

- **Hosting:** GitHub Pages only. Do not use Firebase Hosting.
- **Firebase plan:** stay on the free **Spark** plan. Never upgrade to Blaze. Spark has no card and cannot produce a bill; if a quota runs out, the service just stops until it resets. Use only Auth and Firestore. Do not use Cloud Storage or Cloud Functions.
- **Quotas to design for:** Firestore free tier is 1 GiB storage, 50,000 reads/day and 20,000 writes/day. This app needs a tiny fraction of that (about 60 documents loaded per month view, a few dozen writes per day).
- **Two-month window:** the app only shows the **current month and the previous month**. Navigation (Day, Week and Month) cannot go before the 1st of the previous month, and cannot go past the end of the current month. Older documents may stay in Firestore (they cost nothing); the app simply never loads them.
- **Keep reads low:** one realtime listener per visible range (unsubscribe when the view changes), debounced saves, no polling.

## 3. Data model (Firestore)

```
users/{uid}/days/{yyyy-MM-dd}   (document id = the date key)
  tasks:         string[]        // ordered, non-empty after trim when saved
  hoursOverride: number | null   // null = auto
  updatedAt:     serverTimestamp

users/{uid}/settings/main
  autoHours:     number          // default 9
  timeZone:      string          // default "America/Chicago" (used to decide today's date)
```

- Do not create a document for a day that has no tasks and no override. Delete it if it becomes empty.
- Range loading (week/month): query `days` by document id between the first and last date key of the range. Clamp every range to the two-month window (`minKey` = first day of previous month, `maxKey` = last day of current month, both computed from the workday date in `workday.ts`).

Security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4. Behaviour rules (must match the prototype)

**Task editing (auto-growing textarea per task, no Save button):**
- `Enter`: if the line is not empty, insert a new empty line below and focus it. On an empty line, do nothing.
- `Backspace` on an empty line: remove the line and focus the end of the previous line (keep at least one blank line).
- `Ctrl+Delete`, `Ctrl+Shift+Backspace`, or `Cmd+Delete`: delete the current task even if it has text. A small ✕ on the right of each task does the same (visible on hover or focus, always visible on touch devices).
- `ArrowUp` / `ArrowDown` at the start or end of a line moves to the previous or next line, across days in Week and Month view.
- Day view always shows one trailing empty line and focuses it on load.
- Save automatically (debounce about 600 ms and on blur). Show a small "Saved" or "Saving…" indicator.

**Hours:**
- `displayHours = hoursOverride ?? (hasNonEmptyTask ? autoHours : 0)`.
- Click the number to edit. Accept decimals with `.` or `,`. Empty or invalid input sets the override back to `null`. Override numbers use the accent colour.
- Header shows total hours and days worked for the visible range. Changing `autoHours` updates every non-overridden day.

**Views:**
- Day, Week (Monday to Sunday) and Month, with previous and next buttons and a label that jumps back to today when clicked. Today's row has an accent left border.
- Weekend rows get an amber tint and amber date. The empty first line shows "Weekend · day off" (Week and Month only).
- Week and Month scroll today into view on open.

**Copy button** (copies the visible range as plain text, only days that have tasks):

```
November 2026

Nov 3 (Tue) - 9 h
- Task one
- Task two

Total: 180 h
```

## 5. Folder structure

```
src/
  app/            App.tsx, routes, layout
  features/
    timesheet/    DayView, WeekView, MonthView, DayRow, TaskList, HoursInput, RangeNav, SummaryBar
  lib/
    firebase.ts   init, auth, firestore (persistent local cache)
    workday.ts    workday date + range helpers (date-fns-tz)
    hours.ts      displayHours, totals
    copyText.ts   plain-text report builder
  hooks/          useAuth, useDaysRange, useSettings, useDebouncedSave
  types.ts
docs/prototype.html
.github/copilot-instructions.md
```

## 6. `.github/copilot-instructions.md` (paste this file into the repo first)

```markdown
# Project: Timesheet
Personal timesheet app. React + TypeScript + Vite, Bootstrap 5, Firebase Auth + Firestore, GitHub Pages.
The approved UI and behaviour are in docs/prototype.html. Match it; do not redesign.

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
```

## 7. Phases and prompts

Give the agent one prompt at a time. Test in the browser, then commit before moving on.

### Phase 1: Scaffold
**Prompt:**
> Read `.github/copilot-instructions.md` and `docs/prototype.html`. Create a Vite + React + TypeScript project in this repo with Bootstrap 5, Vitest, ESLint and the folder structure from the plan. Configure Vite `base` for GitHub Pages (repo name) and use a hash router so refreshes work. Add a placeholder page showing the app title. Do not add Firebase yet.

**Done when:** `npm run dev`, `npm run build` and `npm test` all work.

### Phase 2: Firebase and auth
**Prompt:**
> Add Firebase (modular SDK). Create `src/lib/firebase.ts` with Auth and Firestore using `persistentLocalCache` with multi-tab support. Add Google sign-in and sign-out with a `useAuth` hook and a simple login screen; the timesheet screens must only render when signed in. Add `.env.example` with the `VITE_FIREBASE_*` keys and the Firestore rules from the plan in `firestore.rules`. Explain in the README how to create the Firebase project, enable Google sign-in, add the GitHub Pages domain as an authorised domain, and publish the rules.

**Done when:** I can sign in, see my name, and sign out.

### Phase 3: Workday and hours logic (no UI)
**Prompt:**
> Implement `src/lib/workday.ts`: `getWorkdayKey(now)` (the calendar date in America/Chicago, converted with date-fns-tz), `weekRange(key)` (Monday to Sunday), `monthRange(key)`, `isWeekend(key)`, label helpers. Implement `src/lib/hours.ts` (`displayHours`, `rangeTotals`) and `src/lib/copyText.ts` using the format in the plan. Also add `allowedWindow(now)` returning `{minKey, maxKey}` (first day of the previous month to last day of the current month) and `clampRange`. Write Vitest tests with fixed UTC instants: 5:00 PM and 1:00 AM India time (Nov 6 and Nov 7) must both give the same Chicago date; the key changes exactly at Chicago midnight; the daylight saving start and end days in March and November; month boundaries; the 2-month window across a year boundary (January looks back to December) and the override rules.

**Done when:** all tests pass.

### Phase 4: Day view
**Prompt:**
> Build Day view. Create `useSettings` and `useDay(key)` (realtime `onSnapshot` on `users/{uid}/days/{key}`, debounced save, delete the document when it has no tasks and no override). Build `TaskList` with auto-growing textareas and the exact keyboard behaviour in the plan, the ✕ delete button, `HoursInput` with auto/override behaviour, and a Saved/Saving indicator. Day view opens on today's workday date, shows one trailing empty line and focuses it. Add previous/next day buttons and a label that jumps to today. Disable the previous button at the start of the allowed 2-month window and the next button at the end of the current month.

**Done when:** I can add, edit, delete tasks and override hours with only the keyboard, and reload shows the same data.

### Phase 5: Week and Month views, weekends
**Prompt:**
> Add Day/Week/Month switcher and `useDaysRange(start, end)` (one query by document id range with `onSnapshot`). Reuse `DayRow` and `TaskList` for all views. Week is Monday to Sunday. Highlight Saturday and Sunday with an amber tint and "Weekend · day off" placeholder. Respect the 2-month window: disable previous/next when the range would leave `allowedWindow`, and for Week view that straddles the limit only show days inside the window. Mark today, scroll it into view, and add the summary bar (total hours, days worked, auto hours per day setting). Arrow keys move between days.

**Done when:** it behaves like the prototype in all three views.

### Phase 6: Copy and Excel export
**Prompt:**
> Add the Copy button (label changes to "Copy day/week/month", shows "Copied ✓", falls back to a hidden textarea if the clipboard API fails) using `copyText.ts`. Then add "Export Excel" for the month being viewed (current or previous) with ExcelJS: columns Date, Day, Tasks (one task per line, wrapped), Hours, and a total row. Column widths and header style should look clean.

**Done when:** the pasted text matches the plan format and the Excel opens correctly.

### Phase 7: Offline and PWA
**Prompt:**
> Make the app installable and usable offline with `vite-plugin-pwa` (app shell cache, icons, manifest). Confirm Firestore offline persistence queues edits and syncs when back online. Show a small offline badge. Make sure the layout works well on a phone.

**Done when:** I can add tasks in airplane mode and they appear in Firestore after reconnecting.

### Phase 8: Deploy and polish
**Prompt:**
> Add a GitHub Actions workflow that builds with the `VITE_FIREBASE_*` values from repository secrets and deploys to GitHub Pages on push to main (Pages source: GitHub Actions). Do not add Firebase Hosting. Note in the README that Firebase web config values are not secret, but Firestore rules are what protect the data. Add dark mode following the system setting (colour tokens as in the prototype), basic error toasts for failed saves, and a README with setup and deploy steps. Optional, behind a setting and off by default: an "Improve wording" button that rewrites a selected task line with an AI call (propose the safest way to call the API without exposing a key, and ask before implementing).

**Done when:** pushing to main updates the live site.

## 8. Tips for working with the agent

- Commit after every phase and start the next phase in a fresh chat so context stays small.
- If something drifts from the prototype, point to the exact prototype behaviour ("Ctrl+Delete must delete a non-empty task") rather than describing it loosely.
- Test the keyboard flow yourself after Phases 4 and 5. That is the part that makes the app feel like Notepad.

## 9. Database choice (free)

Stay with **Firebase Firestore on the Spark plan**. It is free with no card, has built-in Google sign-in, realtime sync and offline support, and this app uses a tiny part of the free quota. If you ever want to leave Firebase, the data model here (one document per day) maps easily to any SQL table `days(date, tasks, hours_override)`.
