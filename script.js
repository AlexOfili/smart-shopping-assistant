const basket = [];

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
}

document.querySelector("#search").addEventListener("input", e => {
  const query = e.target.value.toLowerCase();
  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(query));
  render(filtered);
});

document.querySelector("#results").addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;

  const id = e.target.dataset.id;
  const product = PRODUCTS.find(p => p.id == id);
  basket.push(product);

  renderBasket();
});

render(PRODUCTS);