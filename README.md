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