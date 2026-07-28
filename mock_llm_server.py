import re
from flask import Flask, jsonify, request

app = Flask(__name__)

CATALOGUE_LINE = re.compile(r"^- (.+?) \(£([0-9.]+), (.+?)\)$", re.MULTILINE)
NEED_LINE = re.compile(r'Shopper\'s need: "(.+?)"')
BUDGET_LINE = re.compile(r"Budget: £([0-9]+(?:\.[0-9]+)?)")
RETRY_MARKER = "exceeds the budget"

# very rough "does this look like a real thing to eat/make" keyword map -
# the point isn't a clever model, it's a deterministic stand-in so the rest
# of the app can be built and tested against something real.
KEYWORD_HINTS = {
    "vegan": ["oat", "tomato", "spinach", "rice", "banana", "pasta"],
    "breakfast": ["oat", "egg", "bread", "yogurt", "banana"],
    "dinner": ["chicken", "rice", "spinach", "tomato", "pasta"],
    "bake": ["sourdough", "bread", "egg"],
}


@app.route("/v1/messages", methods=["POST"])
def messages():
    payload = request.get_json(force=True) or {}
    prompt = payload.get("messages", [{}])[0].get("content", "")

    catalogue = [
        {"name": m.group(1), "price": float(m.group(2)), "aisle": m.group(3)}
        for m in CATALOGUE_LINE.finditer(prompt)
    ]
    need_match = NEED_LINE.search(prompt)
    need = need_match.group(1).lower() if need_match else ""
    budget_match = BUDGET_LINE.search(prompt)
    budget = float(budget_match.group(1)) if budget_match else None
    is_retry = RETRY_MARKER in prompt

    basket = pick_basket(catalogue, need, is_retry)
    total = sum(item["price"] for item in basket)
    lines = [f'- {item["name"]} - £{item["price"]:.2f}' for item in basket]
    text = "\n".join(lines) + f"\nTotal: £{total:.2f}"

    # Same response shape as the real Anthropic API.
    return jsonify({"content": [{"type": "text", "text": text}]})


def pick_basket(catalogue, need, is_retry):
    """A very small deterministic 'model': keyword-match a handful of items,
    only ever choosing from the catalogue it was given in the prompt (this
    is what grounding buys you - it has nothing else to pick from)."""
    chosen = []
    for word, hints in KEYWORD_HINTS.items():
        if word in need:
            chosen = [p for p in catalogue if any(h in p["name"].lower() for h in hints)]
            break
    if not chosen:
        chosen = catalogue[:4]  # fallback: a small general basket

    if is_retry:
        # Budget guardrail retry: keep only the 2 cheapest matching items so
        # the new total comes in lower than the rejected attempt.
        chosen = sorted(chosen, key=lambda p: p["price"])[:2]

    return chosen


if __name__ == "__main__":
    app.run(port=5001, debug=True)