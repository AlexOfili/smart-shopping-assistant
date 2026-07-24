const basket = JSON.parse(localStorage.getItem("basket") || "[]");

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
  document.querySelector("#basket-items").innerHTML = basket.map(p => `
    <li>
      <span>${p.name}</span>
      <span>£${p.price.toFixed(2)}</span>
    </li>
  `).join("");

  const total = basket.reduce((sum, item) => sum + item.price, 0);
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
  const product = PRODUCTS.find(p => p.id == id);
  basket.push(product);

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