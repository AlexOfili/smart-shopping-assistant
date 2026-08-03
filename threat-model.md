# One-Page Threat Model — Smart Shopping Assistant

## 1. What are we protecting? (Assets)

| Asset | Why it matters | If lost, how bad? |
|---|---|---|
| Shopper input and basket data | It can reveal needs, budget and buying behaviour. | Medium |
| Product prices, stock and aisle data | Incorrect data could mislead shoppers and cost the business money. | High |
| API keys, admin access and service availability | These control paid services and protected price changes. | High |

## 2. Who might come after it? (Attackers)

| Attacker | What they want | Capability |
|---|---|---|
| Opportunistic internet user | Abuse the suggestion endpoint, extract errors or disrupt the service. | Low–medium |
| Malicious user or unauthorised staff member | Change prices or access functions meant for an administrator. | Medium |
| Attacker using a compromised dependency or leaked secret | Steal the API key, send paid requests or interfere with the app. | Medium–high |

## 3. How do they get in? (Entry points)

- The shopper form and `POST /api/suggest` JSON body.
- The admin login and price-update API endpoints.
- Browser-rendered product and assistant output, environment variables, third-party packages and the external LLM/weather services.

## 4. STRIDE

| | Threat category | Means | A concrete threat to my app | Mitigation | Done? |
|---|---|---|---|---|---|
| **S** | Spoofing | Pretending to be someone else | An attacker repeatedly guesses the administrator password and signs in as an authorised user. | bcrypt password hashing, login rate limiting and short-lived authentication tokens. | Yes |
| **T1** | Tampering | Changing data or instructions | A shopper submits a negative, zero, non-numeric or extremely large budget, or a "need" string outside the allowed length or character set. | Server-side type, length (1–200 char) and range (£0.01–£500) validation on every field; an invalid budget is rejected rather than silently treated as "no budget". | Yes |
| **T2** | Tampering — prompt injection | Changing data or instructions | A shopper writes text in the "need" field aimed at the LLM itself rather than describing a shopping need — e.g. telling it to ignore the catalogue, invent out-of-stock items, disclose its system prompt, or return a basket that ignores the budget. | Shopper text is labelled as untrusted data in the prompt, never as instructions; suggested items are checked against a server-side catalogue allow-list; the backend independently validates response shape, item existence and total before trusting any LLM output. | Yes |
| **T3** | Tampering | Changing data or instructions | A user without admin rights calls the price-update endpoint directly, bypassing the admin UI, to change a product's price. | The price-update route requires a valid bearer token issued only after admin authentication; prices are additionally validated to a finite £0.01–£10,000 range. | Yes |
| **R** | Repudiation | Performing an action and later denying it | An administrator changes a product price and later denies making the change. | Security audit logs record login attempts, price changes, timestamps and the administrator responsible. | Yes |
| **I** | Information disclosure | Seeing information they should not see | The live-mode Anthropic API key — the highest-value secret in the system — reaches a log line or a browser-facing error response body. This is the concrete risk because the assistant's reply is proxied through my Flask server before it reaches the browser, so any point where the server logs or echoes back what it sent/received to the LLM is a potential leak path. | The key is read only from an environment variable and never embedded in prompts, responses or exception text; caught exceptions are logged server-side without header or key values; the browser only ever receives a generic error message; Flask debug mode (which would print the key via stack traces) is off by default. | Yes |
| **D** | Denial of service | Making the service unavailable | A user repeatedly sends assistant requests until the API or LLM service becomes overloaded. | Flask-Limiter request limits, maximum request sizes, LLM timeouts and limits on retry attempts. | Yes |
| **E** | Elevation of privilege | Gaining permissions they should not have | A normal user obtains an admin token and changes product prices without permission. | Admin authentication, bearer-token checks and authorisation before every price update. | Yes |

## 5. The three things I would fix first

1. **Protect secrets and administrator access** because leaked credentials could allow paid API abuse or price tampering.
2. **Validate and authorise all state-changing requests** because browser checks can be bypassed and untrusted JSON can be sent directly.
3. **Rate-limit and safely render output** because repeated requests can exhaust the service and untrusted model output could become script injection.

## 6. What I am knowingly accepting

- The basket remains in browser `localStorage`; this prototype stores no payment details, passwords or precise location.
- Rate-limit counters and login tokens are held in memory, so they reset when the local server restarts. A production deployment would use Redis or another shared store.
- The app still depends on external LLM and weather services, so temporary outages remain possible; timeouts and safe error messages reduce the impact.