let PRODUCTS = [];

const basket = JSON.parse(localStorage.getItem("basket") || "[]");
// Each basket entry is now { id, qty } 
// Product details from PRODUCTS when needed

function render(list) {
  const results = document.querySelector("#results");
  results.replaceChildren(...list.map(p => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = p.name;

    const meta = document.createElement("p");
    meta.textContent = `£${p.price.toFixed(2)} · ${p.aisle}${p.inStock === false ? " · Out of stock" : ""}`;

    const button = document.createElement("button");
    button.dataset.id = p.id;
    button.disabled = p.inStock === false;
    button.textContent = "Add";

    card.append(title, meta, button);
    return card;
  }));
}

function renderBasket() {
  // Remove any entry with qty < 1, or whose id no longer matches a real product
  for (let i = basket.length - 1; i >= 0; i--) {
    const product = PRODUCTS.find(p => p.id == basket[i].id);
    if (!product || !basket[i].qty || basket[i].qty < 1) {
      basket.splice(i, 1);
    }
  }

  document.querySelector("#basket-items").replaceChildren(...basket.map(entry => {
    const product = PRODUCTS.find(p => p.id == entry.id);

    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${product.name}${entry.qty > 1 ? ` ×${entry.qty}` : ""}`;

    const controls = document.createElement("span");
    controls.className = "basket-item-controls";

    const decBtn = document.createElement("button");
    decBtn.className = "qty-btn";
    decBtn.dataset.id = entry.id;
    decBtn.dataset.action = "dec";
    decBtn.setAttribute("aria-label", `Remove one ${product.name}`);
    decBtn.textContent = "−";

    const incBtn = document.createElement("button");
    incBtn.className = "qty-btn";
    incBtn.dataset.id = entry.id;
    incBtn.dataset.action = "inc";
    incBtn.setAttribute("aria-label", `Add one more ${product.name}`);
    incBtn.textContent = "+";

    controls.append(decBtn, incBtn);

    const priceSpan = document.createElement("span");
    priceSpan.textContent = `£${(product.price * entry.qty).toFixed(2)}`;

    li.append(nameSpan, controls, priceSpan);
    return li;
  }));

  const total = basket.reduce((sum, entry) => {
    const product = PRODUCTS.find(p => p.id == entry.id);
    return sum + product.price * entry.qty;
  }, 0);

  document.querySelector("#total").textContent = `£${total.toFixed(2)}`;

  localStorage.setItem("basket", JSON.stringify(basket));
}

function populateAisles() {
  const aisles = [...new Set(PRODUCTS.map(p => p.aisle))].sort();
  const select = document.querySelector("#aisle-filter");

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All aisles";

  const aisleOptions = aisles.map(a => {
    const option = document.createElement("option");
    option.value = a;
    option.textContent = a;
    return option;
  });

  select.replaceChildren(allOption, ...aisleOptions);
}

function applyFilters() {
  const query = document.querySelector("#search").value.toLowerCase();
  const aisle = document.querySelector("#aisle-filter").value;
  const sort = document.querySelector("#sort").value;

  let list = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query) &&
    (aisle === "" || p.aisle === aisle)
  );

  if (sort === "asc") {
    list = [...list].sort((a, b) => a.price - b.price);
  }

  if (sort === "desc") {
    list = [...list].sort((a, b) => b.price - a.price);
  }

  render(list);
}

document.querySelector("#search").addEventListener("input", applyFilters);
document.querySelector("#aisle-filter").addEventListener("change", applyFilters);
document.querySelector("#sort").addEventListener("change", applyFilters);

document.querySelector("#results").addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;

  const id = e.target.dataset.id;
  const existing = basket.find(entry => entry.id == id);

  if (existing) {
    existing.qty += 1;
  } else {
    basket.push({ id, qty: 1 });
  }

  renderBasket();
});

document.querySelector("#basket-items").addEventListener("click", e => {
  if (!e.target.classList.contains("qty-btn")) return;

  const id = e.target.dataset.id;
  const action = e.target.dataset.action;
  const entry = basket.find(entry => entry.id == id);

  if (!entry) return;

  if (action === "inc") {
    entry.qty += 1;
  } else {
    entry.qty -= 1;

    if (entry.qty <= 0) {
      basket.splice(basket.indexOf(entry), 1);
    }
  }

  renderBasket();
});

const themeToggle = document.querySelector("#theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

const assistantForm = document.querySelector("#assistant-form");
const assistantResult = document.querySelector("#assistant-result");

assistantForm.addEventListener("submit", async e => {
  e.preventDefault();

  const need = document.querySelector("#assistant-need").value.trim();
  const budgetValue = document.querySelector("#assistant-budget").value;
  const budget = budgetValue ? parseFloat(budgetValue) : null;

  if (!need) return;

  assistantResult.textContent = "Thinking...";

  try {
    const res = await fetch(
      "https://smart-shopping-assistant-8a1x.onrender.com/api/suggest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ need, budget })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const budgetNote = data.withinBudget === false
      ? " (couldn't quite fit the budget - showing the closest option)"
      : "";

    // data.suggestion is raw model output. validate_need() only constrains what the
    // shopper's text can contain going INTO the prompt — it says nothing about what
    // the LLM can put in its reply, and in live mode that reply isn't otherwise
    // sanitised. Setting textContent (rather than innerHTML) means any HTML/script
    // markup the model emits, injected or hallucinated, is displayed as plain text
    // and never parsed as markup.
    const pre = document.createElement("pre");
    pre.textContent = data.suggestion;

    const meta = document.createElement("p");
    meta.className = "assistant-meta";
    meta.textContent = `Attempts: ${data.attempts}${budgetNote}`;

    assistantResult.replaceChildren(pre, meta);
  } catch (err) {
    assistantResult.textContent = err.message;
    console.error(err);
  }
});

async function loadProducts() {
  const results = document.querySelector("#results");
  results.textContent = "Loading products...";

  try {
    const res = await fetch(
      "https://smart-shopping-assistant-8a1x.onrender.com/api/products"
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    PRODUCTS = await res.json();

    populateAisles();
    renderBasket();
    applyFilters();
  } catch (err) {
    results.textContent = "Couldn't load products right now.";
    console.error(err);
  }
}

loadProducts();

async function loadWeather() {
  const box = document.querySelector("#weather");
  box.textContent = "Loading store conditions...";

  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current=temperature_2m";

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    box.textContent = `Outside: ${data.current.temperature_2m}°C`;
  } catch (err) {
    box.textContent = "Weather unavailable right now.";
    console.error(err);
  }
}

loadWeather();