# Smart Shopping Assistant


A simple web app for browsing a grocery product list, searching and filtering through it, and building up a shopping basket with a live running total.

**Live Demo:** https://alexofili.github.io/smart-shopping-assistant/




## Features



- Search products
- Filter by aisle and sort by price
- Add items to a basket with a running total
- Basket and dark mode saved between visits
- Responsive on mobile and desktop




### Project structure


- index.html            # page markup
- styles.css             # layout
- script.js               # frontend logic (basket, filters, weather,assistant form)
- app.py                  # Flask API - serves products and the /api/suggest assistant endpoint
- mock_llm_server.py      # stand-in LLM used when LLM_MODE=mock
- prompt-library.md       # prompts used by the assistant, with before/after rationale


## Live data


This app fetches live temperature data from the [Open-Meteo API](https://open-meteo.com/) for London coordinates. No API key is required.

- **What it returns:** current temperature in °C
- **What could go wrong:** the network could be slow or unavailable, or the API
  itself could be down or return an error status. Handled with loading and
  error states in `loadWeather()` in `script.js` — if the fetch fails, the
  widget shows "Weather unavailable right now." instead of breaking or showing
  nothing.




## Known issue: Products require a local server

Products come from a Flask API at `127.0.0.1:5000`. This only runs on my
machine, so it works when I test it as long as the Flask API is running, but it won't work for anyone else viewing the live GitHub Pages link and they'll see "Couldn't load products right now."


Fix would be hosting Flask somewhere public instead of locally.


## How to run it
The assistant needs two local servers running alongside each other (in separate terminals):

- `python mock_llm_server.py` — the mock LLM backend (port 5001), no API key needed
- `python app.py` — the main Flask API (port 5000), which the site talks to

Then open `index.html` as normal (e.g. with Live Server).

## How to use it
Type what you need in the "What do you need?" box — e.g. "a vegan dinner" or "breakfast" — and optionally a budget in £. Click **Ask** and the assistant suggests a basket of in-stock products with a running total, automatically retrying with a cheaper basket if the first suggestion goes over budget.