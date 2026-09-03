# TradeVault — Offline Trading Journal

A fully offline trading journal. No backend, no API keys, no login, no
cloud database. Everything — trades, screenshots, journal entries,
strategies, rules, settings — is stored locally on your device with
IndexedDB, and the app works with airplane mode on.

---

## 1. Requirements on your computer

- [Node.js](https://nodejs.org) 18 or newer (20 LTS recommended)
- For the Android APK step only: [Android Studio](https://developer.android.com/studio) (installs the Android SDK you need)

Everything else (React, Vite, Tailwind, Capacitor) installs via `npm install` below — no accounts, no API keys, no paid services anywhere in this stack.

---

## 2. Run it locally (web, for development)

```bash
cd tradevault
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). This is a normal local dev server on your machine — it does not talk to the internet, and once the page has loaded once you can safely go offline and it keeps working (dev mode has a lighter offline story than the production build below; for a true offline test, use the production build in step 3).

Optional: type-check the project without building:

```bash
npm run typecheck
```

---

## 3. Production build (this is also your PWA build)

```bash
npm run build
```

This runs Vite's production build **and** a small script that writes `dist/precache-manifest.json` so the service worker knows exactly which files to cache for offline use. Output goes to `dist/`.

Preview the production build locally:

```bash
npm run preview
```

Open the printed URL, let the page load once (so the service worker installs and caches everything), then turn on airplane mode / disconnect your network and reload — the app keeps working.

To install `dist/` as a PWA on a phone or desktop without touching Android/Capacitor at all: serve the `dist/` folder over `https://` (or `http://localhost`) with any static file host, open it in Chrome, and use "Add to Home Screen" / the install icon in the address bar.

---

## 4. Package as an Android APK (Capacitor)

Run these once, in order, from the `tradevault` folder:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

- `npx cap add android` creates the `android/` native project (one-time; skip this on later builds).
- `npx cap sync android` copies your latest `dist/` build into the native project. Run this again any time you change the app and rebuild.
- `npx cap open android` opens the project in Android Studio.

In Android Studio:

1. Let Gradle finish syncing (first time takes a few minutes, downloads the Android build tooling — this is the only step in the whole workflow that needs internet, and only once).
2. To test on a device/emulator: click **Run ▶**.
3. To produce an installable APK file: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. When it finishes, click the "locate" link in the notification, or find it at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

For a signed release APK (for distributing outside the Play Store), use **Build → Generate Signed Bundle / APK** and follow Android Studio's signing wizard.

Whenever you change the app code afterwards:

```bash
npm run build
npx cap sync android
```
then re-run/rebuild from Android Studio.

### Installing the APK on a phone

1. Copy `app-debug.apk` to your phone (USB cable, or any file transfer method — it never needs to touch a server).
2. On the phone, open the file. If prompted, allow "install from this source" for your file manager / browser.
3. Tap **Install**.
4. Open **TradeVault** from your app drawer.

---

## 5. Verifying it's really offline

1. Open the app (web build, PWA, or the installed APK) once so it fully loads.
2. Turn on **Airplane Mode** on the device (or disconnect Wi-Fi/data on desktop).
3. Force-close and reopen the app.
4. Confirm: Dashboard loads, you can add a trade, attach a screenshot, view Analytics, and the data is still there after another force-close/reopen.

No screen in the app makes a network request — there is nothing to time out or fail when offline.

---

## 6. Backup & restore

**Settings → Data management:**

- **Export backup (JSON)** — downloads a single `.json` file with every trade, daily journal entry, strategy, rule, setting, and screenshot (screenshots are embedded as base64 inside the file). Keep this file somewhere safe (cloud drive, email to yourself, USB — TradeVault itself never uploads it anywhere; that's on you).
- **Import backup (JSON)** — pick a previously exported file. TradeVault shows you exactly what's in it (trade count, journal entries, etc.) before doing anything, and asks whether records with a matching ID should be kept or overwritten. It **never** deletes data that isn't in the file — importing is always additive.
- **Export trades as CSV** — a spreadsheet-friendly export of just the trades (no screenshots), for use in Excel/Sheets or elsewhere.
- **Clear all data** — wipes everything from this device. Requires confirmation. Export a backup first if you want to keep a copy.

To move your journal to a new phone: export on the old device, transfer the `.json` file however you like, install TradeVault on the new device, and import it there.

---

## 7. Project structure

```
tradevault/
  src/
    components/    Reusable UI (form controls, cards, charts, bottom nav, screenshot uploader)
    pages/          One file per screen (Dashboard, Trades, Add Trade, Analytics, Settings, …)
    store/          React context wired to IndexedDB (AppContext.tsx)
    utils/          Pure calculation, formatting, validation, CSV, and backup logic — no UI code
    types.ts         All shared TypeScript types
    db.ts            IndexedDB access layer (no external dependency)
  public/           PWA manifest, service worker, icons, offline fallback page
  scripts/          Post-build script that generates the service worker's precache list
  capacitor.config.ts
```

Calculation logic (P&L, win rate, profit factor, expectancy, drawdown, R multiple, risk/reward) lives entirely in `src/utils/calculations.ts`, separate from every UI component, so it's easy to audit or extend.

---

## 8. No accounts, no tracking

TradeVault doesn't call any API, doesn't use analytics, and doesn't have a login screen. The only "About" claim is: your data is stored locally on this device and isn't automatically uploaded anywhere. That's enforced by the app simply never making an outbound network request for your data — there's no code path that could.
