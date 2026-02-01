# Fix: "Could not connect to development server"

The app is trying to load the JS bundle from `http://localhost:8081`. Use this checklist.

## 1. Start Metro first (required)

The dev server must be running **before** the app loads.

1. In a terminal, from the project root:
   ```bash
   npm start
   ```
   Or: `npx react-native start`

2. Wait until you see something like:
   ```text
   Welcome to Metro
   Fast - Scalable - Integrated
   ```

3. In a **second** terminal (or from Xcode), run the app:
   ```bash
   npx react-native run-ios
   ```

If you launch the app from Xcode, make sure the same Metro process is already running in a terminal.

## 2. Reload the app

If Metro is already running:

- **Simulator:** Press **⌘R** in the simulator, or use the in-app reload.
- Or tap **Reload** on the red error screen.

## 3. Running on a physical iPhone

On a real device, `localhost` is the phone itself, so the app cannot reach Metro on your Mac.

**Option A – Dev menu (easiest):**

1. Shake the device (or ⌘D in simulator) to open the dev menu.
2. Tap **"Configure Bundler"** or **"Settings"** → set the debug server host to your Mac’s IP, e.g. `192.168.1.100:8081`.

**Option B – `.xcode.env.local`:**

1. In Terminal: `ifconfig | grep "inet "` and note your Mac’s IP (e.g. `192.168.1.100`).
2. Create `ios/.xcode.env.local` (this file is gitignored):
   ```bash
   export RCT_METRO_HOST=192.168.1.100
   ```
3. Rebuild and run the app from Xcode or `npx react-native run-ios --device`.

Replace `192.168.1.100` with your Mac’s actual IP. Phone and Mac must be on the same Wi‑Fi.

## 4. Firewall

If Metro is running and the app still can’t connect (especially on device), ensure your Mac allows incoming connections on port **8081** (System Settings → Network → Firewall / your security tool).

## 5. Reset and try again

```bash
# Kill any process on 8081
npx react-native start --reset-cache
```

Then in another terminal:

```bash
npx react-native run-ios
```

---

**Summary:** Start `npm start` first, keep that terminal open, then run or reload the app. On a physical device, point the app at your Mac’s IP (e.g. via dev menu or `RCT_METRO_HOST` in `ios/.xcode.env.local`).
