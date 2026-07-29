# Prompt Library — Smart Shopping Assistant
Day 6 · Steps 1 & 3
 
## Framework used: S.C.C.E.F.
- **S**pecific — say exactly what you want, not the general topic
- **C**ontext — give the model what it needs to reason with (data, situation)
- **C**onstraints — rules it must follow (budget, allowed items, tone, length)
- **E**xamples — show the shape of a good answer
- **F**ormat — specify exactly how the output should look, especially if code will parse it
## Prompt 1 — Basket suggestion (weak → strong)
 
### Weak prompt
```
Suggest a basket for: "a vegan dinner"
```
 
### Strong prompt (S.C.C.E.F.)
```
You are a supermarket shopping assistant.
Only ever suggest items from the list below - these are the only products
currently in stock, so never invent or suggest anything else.
 
In-stock products:
- Oat Milk 1L (£1.35, Dairy Alt)
- Sourdough Loaf (£2.20, Bakery)
- Cherry Tomatoes 300g (£1.80, Produce)
... [full in-stock catalogue continues]
 
Shopper's need: "a vegan dinner"
Budget: £10.00. Stay at or under this.
 
Return a short bulleted list of items to buy with a running total, formatted like:
- Item name - £X.XX
Total: £X.XX
```
 
### What changed, and why
| Weak prompt | Strong prompt |
|---|---|
| No product list → model can invent items | Full in-stock catalogue pasted in (**Context**) |
| No budget rule | Explicit "stay at or under" budget (**Constraints**) |
| No output shape | Exact bullet + "Total: £X.XX" format (**Format**) — this is what `extract_total()` in `app.py` regex-matches to enforce the budget guardrail |
| Vague instruction | Told exactly what role it's playing and what it must never do (**Specific**) |
 
**Why it works:** the weak prompt has no catalogue, so the model can invent items or suggest ones that are out of stock, in whatever free-text shape it likes. The strong prompt fixes both: the pasted catalogue limits it to real, in-stock products, and the exact `Total: £X.XX` line lets `extract_total()` parse the total and enforce the budget.
 
 
 
## Prompt 2 — Aisle categoriser (for adding new products)
 
```
Categorise this product into exactly one of these aisles: Dairy, Dairy Alt,
Bakery, Produce, Meat, Grocery.
 
Product: "{product_name}"
 
Reply with only the aisle name, nothing else.
```
 
**Why it works:** the closed list of 6 aisles limits the reply to one exact string, so it can go straight into `PRODUCTS` with no validation step.
 
 
 
## Prompt 3 — One-line rationale for a suggested item
 
```
In no more than 12 words, explain why "{item_name}" fits the shopper's need:
"{need}". Do not repeat the price. Reply with plain text, no punctuation at the end.
```
 
**Why it works:** the 12-word cap and "no price" rule remove the two easiest ways to pad the answer, so the result reliably fits a UI tooltip without truncating.