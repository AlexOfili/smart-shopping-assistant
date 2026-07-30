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
| **S / E** | Spoofing / elevation of privilege | Pretending to be an administrator or gaining admin rights | An attacker repeatedly guesses the admin password, steals a token and changes product prices. | bcrypt password hashes, login rate limiting, short-lived bearer tokens and authorisation on price updates. | Yes |
| **T** | Tampering | Changing data or instructions | A user sends a negative/huge budget, malicious prompt text or an unauthorised price value. | Strict server-side type, length and range validation; catalogue allow-listing; admin-only price changes. | Yes |
| **I** | Information disclosure | Seeing secrets or internal details | An API key, stack trace or backend exception is exposed to the browser or logs. | Secrets only in environment variables, generic client errors, scrubbed logs, debug mode off and restricted CORS. | Yes |

## 5. The three things I would fix first

1. **Protect secrets and administrator access** because leaked credentials could allow paid API abuse or price tampering.
2. **Validate and authorise all state-changing requests** because browser checks can be bypassed and untrusted JSON can be sent directly.
3. **Rate-limit and safely render output** because repeated requests can exhaust the service and untrusted model output could become script injection.

## 6. What I am knowingly accepting

- The basket remains in browser `localStorage`; this prototype stores no payment details, passwords or precise location.
- Rate-limit counters and login tokens are held in memory, so they reset when the local server restarts. A production deployment would use Redis or another shared store.
- The app still depends on external LLM and weather services, so temporary outages remain possible; timeouts and safe error messages reduce the impact.
