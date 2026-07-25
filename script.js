const basket = JSON.parse(localStorage.getItem("basket") || "[]");
// Each basket entry is now { id, qty } 
// Product details from PRODUCTS when needed

function render(list) {
  document.querySelector("#results").innerHTML = list.map(p => `
    <div class="card">
      <h3>${p.name}</h3>
      <p>£${p.price.toFixed(2)} · ${p.aisle}</p>
      <button data-id="${p.id}">Add</button>
    </div>
  `).join("");
}

function renderBasket() {
  // Remove any entry with qty < 1, or whose id no longer matches a real product
  for (let i = basket.length - 1; i >= 0; i--) {
    const product = PRODUCTS.find(p => p.id == basket[i].id);
    if (!product || !basket[i].qty || basket[i].qty < 1) {
      basket.splice(i, 1);
    }
  }

  document.querySelector("#basket-items").innerHTML = basket.map(entry => {
    const product = PRODUCTS.find(p => p.id == entry.id);
    return `
      <li>
        <span>${product.name}${entry.qty > 1 ? ` ×${entry.qty}` : ""}</span>
        <span class="basket-item-controls">
          <button class="qty-btn" data-id="${entry.id}" data-action="dec" aria-label="Remove one ${product.name}">−</button>
          <button class="qty-btn" data-id="${entry.id}" data-action="inc" aria-label="Add one more ${product.name}">+</button>
        </span>
        <span>£${(product.price * entry.qty).toFixed(2)}</span>
      </li>
    `;
  }).join("");

  const total = basket.reduce((sum, entry) => {
    const product = PRODUCTS.find(p => p.id == entry.id);
    return sum + product.price * entry.qty;
  }, 0);
  document.querySelector("#total").textContent = `£${total.toFixed(2)}`;

  localStorage.setItem("basket", JSON.stringify(basket));
}

function populateAisles() {
  const aisles = [...new Set(PRODUCTS.map(p => p.aisle))].sort();
  document.querySelector("#aisle-filter").innerHTML =
    `<option value="">All aisles</option>` +
    aisles.map(a => `<option value="${a}">${a}</option>`).join("");
}

function applyFilters() {
  const query = document.querySelector("#search").value.toLowerCase();
  const aisle = document.querySelector("#aisle-filter").value;
  const sort = document.querySelector("#sort").value;

  let list = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query) &&
    (aisle === "" || p.aisle === aisle)
  );

  if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);

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

populateAisles();
renderBasket();
applyFilters();