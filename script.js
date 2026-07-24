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

  const total = basket.reduce((sum, item) => sum + item.price, 0);
  document.querySelector("#total").textContent = `£${total.toFixed(2)}`;
});

render(PRODUCTS);