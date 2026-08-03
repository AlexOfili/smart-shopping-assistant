# Smart Shopping Assistant — Security Hardening Report

## Scope

I reviewed the Flask API, mock LLM server and browser JavaScript. The main assets are shopper requests and budgets, the product catalogue and prices, the live LLM API key, administrator access and service availability.

## Changes made

### 1. Secret management

The live LLM key remains outside source code and is read from `API_KEY` only in live mode. Admin credentials and database settings are also environment variables. `.env.example` contains placeholders rather than real values. Any value previously committed or shared must be rotated because deleting it from the newest file does not remove it from Git history.

### 2. bcrypt password hashing and authorisation

The app now creates an administrator record using `bcrypt.hashpw()` with a work factor of 12. Login checks the password using `bcrypt.checkpw()` and returns a random bearer token that expires after 30 minutes. The new price-update route requires a valid token before it changes data. SQL used for the administrator lookup and audit log is parameterised.

### 3. Rate limiting

Flask-Limiter protects the whole API and applies stricter limits to expensive or sensitive routes. Suggestions are limited to 10 requests per minute, login attempts to 5 per minute and price changes to 20 per minute. This reduces password guessing and resource exhaustion. The in-memory store is suitable for the local prototype; production should use a shared store such as Redis.

### 4. Input validation

The server no longer treats an invalid budget as if no budget was supplied. It checks JSON content type, object shape, need type, 1–200 character length, allowed characters and a budget range of £0.01–£500. Admin prices must be finite numbers from £0.01 to £10,000. Request bodies are capped at 16 KB.

### 5. Safer LLM use

The prompt labels shopper text as untrusted data and keeps the catalogue allow-list. The backend checks HTTP status, response shape, response length and the presence of a finite total. It retries over-budget suggestions but rejects malformed replies. Network calls have connection and read timeouts. Live mode only permits the expected HTTPS Anthropic host; mock mode only permits localhost.

### 6. Information-disclosure controls

Detailed backend exceptions are logged server-side but are no longer returned to the browser. Client errors are generic and logs do not include API keys, passwords or bearer tokens. Flask debug mode is off by default.

### 7. Browser and API hardening

CORS is restricted to the configured local Live Server origins. Responses include `nosniff`, frame, referrer, cache and permissions headers. Four places still built markup with `innerHTML` and string interpolation — the product grid, the basket list, the aisle filter, and the assistant result panel. The last one was the most serious: it inserted `data.suggestion`, the LLM's raw reply, directly as HTML. `validate_need()` only constrains what the shopper's text can contain going into the prompt; it does not sanitise what the model sends back, so in live mode any HTML or script markup the model echoed or was tricked into emitting would have been parsed and run. All four are now built with `document.createElement`/`textContent` (`replaceChildren` instead of `innerHTML` assignment), so interpolated text — product names, aisle names, and the model's suggestion — is always inserted as text, never parsed as markup, closing the stored/reflected XSS path regardless of what the source data contains.

### 8. Auditability

Successful and failed admin logins and price changes are recorded in a small SQLite audit table. This reduces repudiation because protected actions leave a timestamped event record without storing passwords or tokens.

## Risks deliberately accepted for this prototype

- Product data and login tokens are held in process memory, so changes and sessions reset when the server restarts.
- The basket remains in browser local storage because it contains no payment card data or account password.
- The weather and LLM services can still be unavailable. Timeouts and safe fallback messages limit the effect.
- The security audit records events but is not tamper-proof. A production system would send logs to a protected central service.