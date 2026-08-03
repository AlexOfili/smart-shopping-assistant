# Smart Shopping Assistant

A small grocery shopping web app with an AI assistant that turns a free-text need
("a vegan dinner", "breakfast under £5") into an actual basket of in-stock products
that respects a budget — with a security story behind it.

> **Try it now — no install needed:**
> Frontend: **<https://alexofili.github.io/smart-shopping-assistant/>**
> API: **<https://smart-shopping-assistant-8a1x.onrender.com/api/products>**

---

## Table of contents

1. [What it does](#what-it-does)
2. [What's in the box](#whats-in-the-box)
3. [Project layout](#project-layout)
4. [Run it locally in 4 commands](#run-it-locally-in-4-commands)
5. [How to use the app](#how-to-use-the-app)
6. [Environment variables](#environment-variables)
7. [Deploying your own copy](#deploying-your-own-copy)
8. [Security & hardening](#security--hardening)
9. [What I built and why](#what-i-built-and-why)
10. [Known limitations](#known-limitations)

---

## What it does

| Feature | What you actually see |
|---|---|
| **Browse the catalogue** | 12 products, with search, aisle filter and price sort. |
| **Build a basket** | Click **Add** to drop items in; quantity buttons; running total. |
| **Persistence** | Basket and dark/light theme survive a page refresh (localStorage). |
| **Live data** | Current London temperature pulled from the free [Open-Meteo](https://open-meteo.com/) API, shown top-right. |
| **AI assistant** | Type a need and (optionally) a budget; the assistant suggests a basket of real, in-stock products and retries cheaper if it overshoots. |
| **Admin** | A small authenticated endpoint lets you change a product's price live; every change is audit-logged. |

It also ships with rate limiting, input + output validation on the AI, CORS allow-listing, secure HTTP headers, and bcrypt-protected admin login.

---

## What's in the box

**Frontend**
- `index.html` — semantic markup, accessible labels, ARIA live regions
- `styles.css` — responsive layout, light/dark theme
- `script.js` — basket state, filters, weather widget, assistant form

**Backend (Flask)**
- `app.py` — single-file API: products list, AI suggestion, admin login, price update, security headers, rate limits
- `mock_llm_server.py` — *legacy* standalone mock LLM kept for reference; the **in-process** mock in `app.py` is what the app actually uses now

**Tooling & docs**
- `requirements.txt` — Python deps (Flask, flask-cors, flask-limiter, bcrypt, requests, gunicorn)
- `Procfile` + `runtime.txt` — Render deploy
- `prompt-library.md` — the prompts and the before/after reasoning
- `threat-model.md`, `security-report.md` — the STRIDE-driven hardening notes

---

## Project layout

```
smart-shopping-assistant/
├── app.py                  # Flask API: products, /api/suggest, admin endpoints
├── mock_llm_server.py      # Legacy standalone mock (kept for reference)
├── index.html              # Frontend markup
├── styles.css              # Layout + theme
├── script.js               # Frontend logic
├── prompt-library.md       # Prompts + before/after rationale
├── threat-model.md         # STRIDE analysis
├── security-report.md      # Hardening notes
├── requirements.txt
├── Procfile                # Render start command
├── runtime.txt             # Python version pin
└── README.md               # ← you are here
```

---

## Run it locally in 4 commands

You need **Python 3.10+** installed. That's it — no Node, no Docker.

```bash
# 1. Clone and enter the project
git clone https://github.com/AlexOfili/smart-shopping-assistant.git
cd smart-shopping-assistant

# 2. Create a virtual env (keeps your global Python clean)
python -m venv .venv

# 3. Activate it
#    macOS / Linux:
source .venv/bin/activate
#    Windows (PowerShell):
.venv\Scripts\Activate.ps1

# 4. Install deps and start the API
pip install -r requirements.txt
python app.py
```

The API is now running at **<http://127.0.0.1:5000>**. Quick sanity check:

```bash
curl http://127.0.0.1:5000/api/products
# → JSON list of 12 products
```

Now open the frontend. The easiest way is the **VS Code "Live Server" extension** on `index.html`, or any static file server. From the project root:

```bash
# Pick ONE of these (any will do):
python -m http.server 5500     # then open http://127.0.0.1:5500
npx serve .                    # if you have Node
```

Open the printed URL (e.g. <http://127.0.0.1:5500>) in your browser. You should see the catalogue load and the assistant form work.

> **Why two ports?** The API runs on `5000` and the static site runs on `5500`. The API's CORS allow-list already includes both `http://127.0.0.1:5500` and `http://localhost:5500`, so it just works.

### Don't want to clone it?

Just open **<https://alexofili.github.io/smart-shopping-assistant/>** — it's the same app talking to the deployed Render API.

---

## How to use the app

1. **Search, filter, sort** using the controls at the top.
2. Click **Add** on any product card to put it in your basket (left sidebar). Use **+ / −** to change quantity.
3. In the **Smart Assistant** box, type something like:
   - `a vegan dinner`
   - `breakfast`
   - `dinner under £6`
4. Hit **Ask**. You'll see a suggested basket with a total. If you gave a budget and the first attempt overshot, the app retries with a cheaper basket (up to 3 safe attempts).

> Out-of-stock items are marked and the **Add** button is disabled — and the assistant is told to ignore them.

---

## Environment variables

All optional in the default (mock) mode. The app boots happily with no env vars set.

| Variable | Default | What it does |
|---|---|---|
| `LLM_MODE` | `mock` | `mock` = in-process deterministic LLM. `live` = call the real Anthropic API. |
| `LLM_URL` | *(empty in mock, `https://api.anthropic.com/v1/messages` in live)* | Where to POST the LLM call. Must be `https://api.anthropic.com` if `live`. |
| `API_KEY` | *(unset)* | Required **only** when `LLM_MODE=live`. The app refuses to start in live mode without it. |
| `ADMIN_USERNAME` | `admin` | Username for the admin login. |
| `ADMIN_PASSWORD` | *(unset)* | Password for the admin login. Must be **12–72 UTF-8 bytes**. If unset, admin login and price updates are disabled (and a warning is logged at startup). |
| `CORS_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` | Comma-separated list of origins allowed to call the API. |
| `RATELIMIT_STORAGE_URI` | `memory://` | Swap for a Redis URL in production. |
| `FLASK_DEBUG` | `0` | Set to `1` only for local development. |
| `SECURITY_DB_PATH` | `shopping_security.db` | SQLite file for the admin user and audit log. |

Example for live mode (Anthropic):

```bash
export LLM_MODE=live
export API_KEY=sk-ant-...
python app.py
```

---

## Deploying your own copy

The repo is already shaped for Render's free tier.

1. Push the repo to your GitHub.
2. On Render, click **New → Web Service** and connect the repo.
3. Render auto-detects the `Procfile` (`gunicorn --bind 0.0.0.0:$PORT app:app`) and `runtime.txt` (`python-3.10.2`).
4. Add the env vars you want (see table above). At minimum, set `ADMIN_PASSWORD` if you want the admin endpoints to work.
5. Wait for the deploy. Your API is at `https://<your-service>.onrender.com`.
6. To use your own API in the frontend, edit the two `fetch(...)` URLs at the top of `script.js` (`/api/suggest` and `/api/products`) to point at your Render URL, and update `CORS_ORIGINS` to include wherever you host the static site.

> **Cold start note:** Render's free tier spins down after ~15 min of inactivity. The first request after a quiet period will be slow while the service wakes up.

---

## Security & hardening

The hardening story is documented in detail in `threat-model.md` and `security-report.md`. The short version, mapped to STRIDE:

- **Tampering (prompt injection)**
  - *Input side:* shopper's free-text need is matched against a tight allowlist (`A-Za-z 0-9 £.,!?&'()/:+\-`) and capped at 200 chars.
  - *Output side:* the assistant's response is re-parsed line-by-line and **every item and price must exactly match an in-stock product**; otherwise the request is rejected.
- **Tampering (unauthorized price change)**: `/api/admin/products/<id>/price` is gated behind a short-lived bearer token issued by `/api/admin/login`, which uses bcrypt (cost 12) and rejects passwords outside 12–72 UTF-8 bytes.
- **Information disclosure (API key)**: live-mode errors log only the HTTP status and exception type — never the headers, outgoing prompt, or raw response body.
- **DoS**: 16 KB request-body cap, per-IP rate limits (60/min products, 10/min suggest, 5/min admin login, 20/min price updates, 120/min global), 413 / 429 handlers.
- **Spoofing / Repudiation**: admin logins and price changes are written to a `security_audit` table.
- **Elevation of privilege**: token expiry (30 min) and bearer-only access.

HTTP response headers on every API response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`.

---

## What I built and why

I built this as a capstone for the Knull Work Experience Programme. The point wasn't
just "an LLM that picks groceries" — it was to make a thing that *behaves like a product*:
real product browsing, a real basket and real security.

**The two things I care about most:**

1. **The model is grounded.** The assistant only ever sees the in-stock catalogue in its prompt, and on the way back out we *re-check* that every line item it returns exactly matches that catalogue. If a malicious shopper tries prompt-injection to get it to invent an item or misquote a price, the request is rejected.
2. **The budget guardrail is real.** When you give a budget, the API keeps the LLM's first attempt. If it's over budget, it tells the model why and asks for a cheaper basket, up to 3 attempts. If we still can't get under budget, the API returns the best safe attempt with a clear `withinBudget: false` note — it never silently lies about totals.


---

## Known limitations

- **Mock LLM is intentionally simple.** It's a keyword map (`vegan`, `breakfast`, `dinner`, `bake`) plus a fallback. It exists so the rest of the app is testable without a paid API key. Flip `LLM_MODE=live` to swap in a real model — nothing else changes.
- **Single-store, no auth for shoppers.** This is a demo, not a production grocery service. The basket is in `localStorage` and there's no checkout.
- **London-only weather.** Easy to change; `script.js` → `loadWeather()`.

---


