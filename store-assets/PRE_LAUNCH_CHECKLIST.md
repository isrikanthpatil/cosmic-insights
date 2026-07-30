# Astropanth — Pre-Launch Checklist (Google Play)

Run through this **the moment production access is granted** (and you can verify most of it now while the review runs). Each item lists **what**, **how to check**, and **why it matters**. Play Console path is written as menu clicks.

---

## A. While the review is still running (do now)

### 1. Confirm the production track has the latest build
- **What:** The AAB in the Production track should be the newest one — the one with the share card and all closed-test fixes.
- **How to check:** Play Console → **Test and release → Production → Releases**. Look at the top release and note the **version code** (e.g. `versionCode 12`). Compare it to your Closed testing track (**Testing → Closed testing → your track → Releases**) — Production's version code should be **equal to or higher** than what you tested.
- **Why:** A common mistake is production sitting on an old/empty build. If access is granted and the wrong AAB is live, users get a stale app.
- **If wrong:** Upload the correct `.aab` (from `eas build --profile production --platform android`) to the Production release before you finalise.

### 2. Check the rollout percentage
- **What:** Decide staged vs full rollout.
- **How to check:** In the Production release, look for **"Rollout percentage."**
- **Recommendation:** Start at **20%** for the first 2–3 days, then bump to 50%, then 100% once you see no crash spike. For a small first launch, 100% is also fine — your call.
- **Why:** Staged rollout lets you halt if a crash shows up before it hits everyone.

### 3. Store listing is complete
- **What:** Title, short & full description, screenshots, feature graphic, app icon.
- **How to check:** Play Console → **Grow → Store presence → Main store listing.** Every required field should show a green tick / no error banner.
- **Specifics to confirm:**
  - App name shows **Astropanth** (not "Cosmic Insights").
  - At least **2 phone screenshots** (Google requires min 2; 4–8 is better).
  - Feature graphic uploaded (1024×500).
  - Short description mentions astrology + numerology + India.
- **Why:** You cannot go live with an incomplete listing.

### 4. Data safety form
- **What:** Declaration of what data you collect and how.
- **How to check:** Play Console → **Policy → App content → Data safety.** Status should be **"Complete."**
- **Confirm it reflects reality:** birth details (date/time/place) and account email are collected; data is sent to your server (api.astropanth.com); state whether it's encrypted in transit (it is — HTTPS) and whether users can request deletion (yes — you have a delete-account page).
- **Why:** Mismatched data-safety declarations are a top rejection/enforcement reason.

### 5. Content rating
- **What:** IARC questionnaire result.
- **How to check:** Play Console → **Policy → App content → Content ratings.** Should show a rating (astrology apps are typically rated for all/teen).
- **Why:** Required before release; also affects age visibility.

### 6. App content declarations all green
- **What:** Privacy policy, ads, target audience, government-app, financial-features, health declarations, etc.
- **How to check:** Play Console → **Policy → App content.** Every row should read **"Completed."**
- **Confirm:** Privacy policy URL points to a live page — test `https://www.astropanth.com/privacy` loads. Ads declaration = **No ads** (matches your listing).
- **Why:** Any incomplete row blocks the release or triggers later enforcement.

### 7. Countries / regions
- **What:** Where the app is available.
- **How to check:** Production release → **Countries / regions.** Confirm **India** is selected (add others if you want).
- **Why:** If India isn't ticked, your target users can't install it.

---

## B. The moment production access is granted

### 8. Promote / finalise the release
- **What:** Send the reviewed build to production.
- **How:** Play Console → **Production → Releases → Edit/Review release → Start rollout to Production.** Confirm.
- **Watch for:** A final "errors, warnings" panel — resolve any red errors (warnings like the deobfuscation-file note are safe to ignore).

### 9. Confirm "Available" status
- **What:** The app actually goes live.
- **How to check:** **Production → Releases** shows **"Available on Google Play."** The public listing (`play.google.com/store/apps/details?id=com.astropanth.cosmicinsights`) becomes reachable — note it can take **a few hours** to appear in search.
- **Why:** "Live" in console ≠ instantly searchable; give it time before assuming something's wrong.

---

## C. Day-one monitoring (first 48 hours)

### 10. Crashes & ANRs
- **How to check:** Play Console → **Quality → Android vitals → Crashes and ANRs.** Watch the crash-free-users %.
- **Action:** If crash rate spikes above ~1–2%, pause the staged rollout (Production release → **Halt rollout**) and investigate before resuming.

### 11. Install & uninstall numbers
- **How to check:** Play Console → **Statistics.** Track installs vs uninstalls.
- **Why:** High immediate uninstall = onboarding or first-run problem worth a quick look.

### 12. Reviews & ratings
- **How to check:** Play Console → **Ratings and reviews → Reviews.** Reply to early reviews — it helps ranking and shows you're active.

### 13. Backend health
- **What:** Your PocketBase server (api.astropanth.com) and Groq key must stay up under real traffic.
- **How to check:** Hit `https://api.astropanth.com/api/health` (or open the app and run an AskAstro query). Keep an eye on the DigitalOcean droplet's CPU/memory.
- **Why:** A live launch drives real load to AskAstro; a down server = broken first impression.

---

## D. Target API level 36 — required before your next UPDATE (deadline Aug 31, 2026)

> **Important:** This does NOT block the current production review or the app going live. It only means that **from Aug 31, 2026 you cannot publish app *updates*** unless the app targets Android 16 (API level 36) or higher. Your app currently targets API 35 (Expo SDK 53's default). Do this before your next production build (e.g. the share-card update).

### 14. Raise target SDK to 36
Choose ONE path:

**Option 1 — Force API 36 on the current SDK 53 (quick, recommended for now).**
- Install the plugin: `npx expo install expo-build-properties`
- Add to `app.json` → `expo.plugins`:
  ```json
  [
    "expo-build-properties",
    {
      "android": {
        "compileSdkVersion": 36,
        "targetSdkVersion": 36,
        "buildToolsVersion": "36.0.0"
      }
    }
  ]
  ```
- Rebuild: `eas build --profile production --platform android`
- **Test on a real device before pushing** — SDK 53 isn't officially tested against API 36, so verify keyboard/safe-area/notifications still behave (you already run edge-to-edge, which API 36 forces, so the main risk area is covered).

**Option 2 — Upgrade to Expo SDK 54 (proper long-term fix).**
- SDK 54 targets API 36 by default. Bigger job (RN 0.79→0.81, React 19, dependency bumps) and needs a full regression re-test. Plan as a separate task, not a launch blocker.

### 15. Publish and confirm compliance
- Publish the new (API 36) build to production (test via internal/closed first if you want).
- Google emails a confirmation that the app is no longer affected. Verify the target-API warning disappears from Play Console → **Policy → App content** (or the Inbox notification clears).

---

## Quick reference — is everything green?
Play Console → **Policy → App content** and **Grow → Store presence → Main store listing** are the two pages where a single red item will block you. If both are all-green and the Production track has the right AAB, you're ready to launch the moment access lands.
