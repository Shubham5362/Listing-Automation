# Phase 14 — AI Form Autofill Engine

Phase 14 adds semantic marketplace-form discovery on top of the Universal Product Schema and existing marketplace adapters.

## Flow

1. A marketplace form supplies field metadata such as name, id, label, placeholder, ARIA label, autocomplete hint, type, required state, and options.
2. The discovery engine normalizes the metadata and matches it against canonical Product Brain fields.
3. A matched field is assigned a canonical key such as TITLE, BRAND, COLOR, WEIGHT, HSN, or GST_RATE.
4. The existing confidence and verification rules decide whether a value can be planned.
5. Unknown or low-confidence fields remain review-only; no product value is invented.
6. Adapter-specific field names are retained separately from canonical names, allowing one Product Brain to target different marketplaces.

## Boundary

This phase does not claim that recognizing a form is equivalent to safely submitting it. Browser automation is a separate high-risk capability. The planner remains deterministic and auditable, while actual marketplace writes stay behind adapter, policy, approval, credential, idempotency, and audit controls.

## Examples

- itemName + Product Title -> TITLE
- package_weight + Package Weight -> WEIGHT
- an unknown seller-specific field -> unmapped and review

## Verification

The new tests cover semantic title discovery, marketplace-specific weight naming, and safe handling of unknown fields.
