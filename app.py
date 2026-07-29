import os
import re
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PRODUCTS = [
  { "id": 1, "name": "Oat Milk 1L", "price": 1.35, "aisle": "Dairy Alt", "inStock": True },
  { "id": 2, "name": "Sourdough Loaf", "price": 2.20, "aisle": "Bakery", "inStock": True },
  { "id": 3, "name": "Cherry Tomatoes 300g", "price": 1.80, "aisle": "Produce", "inStock": True },
  { "id": 4, "name": "Free Range Eggs (6)", "price": 2.10, "aisle": "Dairy", "inStock": True },
  { "id": 5, "name": "Cheddar Cheese 200g", "price": 2.75, "aisle": "Dairy", "inStock": False },
  { "id": 6, "name": "Basmati Rice 1kg", "price": 2.40, "aisle": "Grocery", "inStock": True },
  { "id": 7, "name": "Chicken Breast Fillets 500g", "price": 4.50, "aisle": "Meat", "inStock": True },
  { "id": 8, "name": "Spinach 200g", "price": 1.10, "aisle": "Produce", "inStock": True },
  { "id": 9, "name": "Greek Yogurt 500g", "price": 1.95, "aisle": "Dairy", "inStock": False },
  { "id": 10, "name": "Wholemeal Bread", "price": 1.60, "aisle": "Bakery", "inStock": True },
  { "id": 11, "name": "Bananas (per kg)", "price": 0.89, "aisle": "Produce", "inStock": True },
  { "id": 12, "name": "Pasta Penne 500g", "price": 1.20, "aisle": "Grocery", "inStock": True },
]

@app.route("/api/products")
def products():
    return jsonify(PRODUCTS)



LLM_MODE = os.environ.get("LLM_MODE", "mock")
LLM_URL = os.environ.get(
    "LLM_URL",
    "http://127.0.0.1:5001/v1/messages" if LLM_MODE == "mock"
    else "https://api.anthropic.com/v1/messages",
)
MAX_GUARDRAIL_ATTEMPTS = 3


def call_llm(prompt):
    """Send the prompt to whichever backend LLM_MODE points at.

    The api-key header is only ever constructed in the `if LLM_MODE == "live"`
    branch below - in mock mode `headers` never gains that key in the first
    place, so there is nothing to leak to the local mock server.
    """
    headers = {"content-type": "application/json"}
    if LLM_MODE == "live":
        headers["x-api-key"] = os.environ["API_KEY"]
        headers["anthropic-version"] = "2023-06-01"

    resp = requests.post(
        LLM_URL,
        headers=headers,
        json={
            "model": "claude-sonnet-4-6",
            "max_tokens": 400,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"]


def build_prompt(need, budget, previous_total=None):
    """Grounding: the model is only ever shown in-stock products, and is told
    not to suggest anything outside that list - so it can't invent items or
    recommend things that are out of stock."""
    in_stock = [p for p in PRODUCTS if p["inStock"]]
    catalogue = "\n".join(f'- {p["name"]} (£{p["price"]:.2f}, {p["aisle"]})' for p in in_stock)

    budget_line = f"Budget: £{budget:.2f}. Stay at or under this." if budget is not None else "No fixed budget given."
    retry_line = (
        f'\nYour previous basket totalled £{previous_total:.2f}, which exceeds the budget. '
        "Suggest a cheaper basket - swap or drop items so the new total fits the budget."
        if previous_total is not None else ""
    )

    return f"""You are a supermarket shopping assistant.
Only ever suggest items from the list below - these are the only products
currently in stock, so never invent or suggest anything else.

In-stock products:
{catalogue}

Shopper's need: "{need}"
{budget_line}{retry_line}

Return a short bulleted list of items to buy with a running total, formatted like:
- Item name - £X.XX
Total: £X.XX
"""


def extract_total(text):
    match = re.search(r"Total:\s*£\s*([0-9]+(?:\.[0-9]+)?)", text)
    return float(match.group(1)) if match else None


@app.route("/api/suggest", methods=["POST"])
def suggest():
    data = request.get_json(force=True) or {}
    need = (data.get("need") or "").strip()
    budget = data.get("budget")
    try:
        budget = float(budget) if budget not in (None, "") else None
    except (TypeError, ValueError):
        budget = None

    if not need:
        return jsonify({"error": "Tell us what you need, e.g. 'a quick vegan dinner'"}), 400

    previous_total = None
    suggestion = ""
    attempt = 0
    for attempt in range(1, MAX_GUARDRAIL_ATTEMPTS + 1):
        prompt = build_prompt(need, budget, previous_total)
        try:
            suggestion = call_llm(prompt)
        except Exception as exc:
            return jsonify({"error": f"Assistant unavailable: {exc}"}), 502

        total = extract_total(suggestion)

        # Guardrail: reject and retry while the basket is over budget.
        if budget is None or total is None or total <= budget:
            return jsonify({
                "suggestion": suggestion,
                "attempts": attempt,
                "withinBudget": (budget is None) or (total is not None and total <= budget),
            })
        previous_total = total

    return jsonify({
        "suggestion": suggestion,
        "attempts": attempt,
        "withinBudget": False,
        "note": "Couldn't fit the budget after several tries - showing the closest attempt.",
    })


if __name__ == "__main__":
    app.run(debug=True)