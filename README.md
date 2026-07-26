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


index.html


styles.css


script.js


data/products.js



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


 