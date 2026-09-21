# RevoU Mystery Discount — Blind Box Game

A playful lead-capture mini-game. The visitor lands on the title screen, taps
"Buka Kotak" to bring up a quick name + email pop-up, then picks one of three
mystery boxes, watches a suspenseful shake/reveal, and wins a weighted-random
discount. Every play is logged to a Google Sheet.

**Flow:** Intro (title card) → "Buka Kotak" → login pop-up (name + email) →
Choose 1 of 3 boxes → Suspense (shake + blink) → Reveal (prize + claim).

Prizes are per program (each program has its own folder + `PRIZES` array):

**Data Analytics / Digital Marketing** (`data-analytics/`, `digital-marketing/`)
- **Rp 1.000.000 + 1.000.000** — 70%
- **Rp 1.000.000 + BNSP** — 20%
- **Rp 1.000.000 + 2.000.000** — 10% (rare "jackpot")

**Software Engineering** (`software-engineering/`)
- **Rp 2.500.000 + 1.000.000** — 70%
- **Rp 2.500.000 + 500.000** — 20%
- **Rp 2.500.000 + 2.000.000** — 10% (rare "jackpot")

## Files

```
index.html            The whole game (5 scenes, animations, prize logic, Sheets calls)
assets/
  BB_.png             Mystery box (intro + blink state)
  BB1/2/3.png         The three choosable boxes
  logo.png            "MYSTERY DISCOUNT!" pixel title (generated)
  revoulogo.png       RevoU brand badge
  bg_loop.mp4         Spotlight-stage background (generated, seamless loop)
  theme.m4a           Looping arcade theme song (generated)
  suspense.m4a        Suspense music during the shake (generated)
  ding.mp3            Prize reveal chime (generated)
  silkscreen.ttf      Pixel font
apps-script/Code.gs   Google Apps Script Web App backend
```

The game references assets by **relative path**, so just host the whole folder
(or open `index.html` locally) — everything works offline except the Sheet
logging, which needs the backend below.

## Run it locally

Because the game loads a font/video via `fetch`-like requests, open it through a
local server (not `file://`) so those assets load:

```bash
# from the project folder
python -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly mostly works too, but a server avoids browser
restrictions on local font/video loading.

## Connect Google Sheets (one play per email + logging)

1. Create a new **Google Sheet** (any name).
2. In that sheet: **Extensions → Apps Script**.
3. Delete the default code, paste in the contents of `apps-script/Code.gs`, and **Save**.
4. Click **Deploy → New deployment → Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Deploy, authorize when prompted, and **copy the Web app URL** (ends in `/exec`).
5. Open `index.html`, find this line near the top of the `<script>`:
   ```js
   const SHEET_API = "";
   ```
   Paste your `/exec` URL between the quotes and save.

That's it. The sheet auto-creates a **Plays** tab with columns:
`Timestamp | Name | Email | Prize | Box | UserAgent`.

> **Note:** if you leave `SHEET_API = ""`, the game still runs fully — it just
> skips Sheet logging and relies on `localStorage` for the one-play guard (per
> browser). For a real campaign, set the URL.

## How the one-play-per-email rule works

- On login, the game GETs the Apps Script with `?email=` to check if that email
  already played (and also checks `localStorage` as a fast local guard).
- If found, it shows the "already played" screen with the prize they won.
- The prize is decided **client-side** (weighted random) and logged on reveal.
  This is a marketing game, not a vault — the guard is best-effort.

## Changing the promo

- **Prize amounts / odds:** edit the `PRIZES` array in `index.html`.
- **Discount headline number:** edit the `<span class="big">` text in the intro
  scene. (The "MYSTERY DISCOUNT!" wordmark is an image; the *amount* is live
  text, so you can change it freely without re-generating anything.)
