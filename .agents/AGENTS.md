# FASTNET LOYALTY — AGENT CONSTITUTION
These rules are law. They were each earned by a real failure in this project. Violating one is not a style choice — it is a defect.

## 1. THE REPO IS THE ONLY TRUTH
- First act of EVERY session: `git fetch origin && git reset --hard origin/master`. Confirm and report the hash. Never work in a stale or second folder.
- Work that is not committed AND pushed to master does not exist. Every report ends with the commit hash and the words "pushed to master".
- Never claim a change without `git diff --stat` proving real lines changed in the files you name.

## 2. HONESTY OUTRANKS COMPLETENESS
- Every requested item is reported exactly DONE or NOT DONE. A half-done item reported as done has cost this project more time than any bug.
- Never write victory audits ("everything fully operational") in place of implementation. Audits are not work.
- When citing implementation, cite file:line. If you cannot produce the citation, the item is NOT DONE.

## 3. SCOPE IS A FENCE
- Implement ONLY what the prompt lists. No refactors, no "improvements", no drive-by edits. If you notice something worth fixing, FLAG it in the report; do not touch it.
- Never use the browser subagent unless the prompt explicitly asks. Verification is external (user clicks + independent code review).

## 4. THE GATE BATTERY — run before every commit, paste raw outputs
- `npx eslint src/App.jsx` → 0 errors (kills phantom identifiers; a function called but never defined shipped four dead buttons once)
- `node backend/tests/regression.js` → all pass; the count only ever grows. Every bug fixed adds a test.
- `npx vite build` → clean
- `grep -c "window.confirm" frontend/src/App.jsx` → 0 (browsers silently suppress native dialogs; use the global triggerConfirmModal system)
- `grep -c "অর্ডার" frontend/src/App.jsx` → ≥ 25 (Bengali must never silently vanish) and `grep -rc "â€"` in src → 0 (no encoding corruption; all writes UTF-8)
- `grep -c "SHIPPED" frontend/src/App.jsx` → 0 (dead enum; frontend and backend status vocabularies must always match — when an enum changes, grep every sender)

## 5. CODE LAW
- Every user-facing string goes through t(English, Hindi, Bengali). No emojis — Lucide icons only.
- No magic numbers: business rules live in backend/config.js as named constants.
- Money and points are append-only ledgers. Balances are computed, never stored-and-mutated.
- Every money-state operation (release, refund) is idempotent: repeat call = no-op, never double-move.
- Ownership is enforced server-side (a stockist edits only their own products/orders); the UI hiding a button is not security.
- Never render a number you invented: no fallback margins, rates, or amounts. Missing data → omit the line, never fabricate.
- Never ship a control that promises what the backend doesn't do. A button with no working backend path is a lie in pixel form.

## 6. REGULATORY LINES — absolute, no exceptions, flag-and-refuse if a prompt seems to cross them
- Points are EARNED from commission on completed orders only. Paid money NEVER converts into points under any flow (that would make them a regulated prepaid instrument).
- Points credit only on DELIVERED, any payment mode. Cancellation reverses/never-credits.
- Customer funds live with the payment gateway (HELD) — never in a platform account. Refunds are admin-triggered (REFUND_DUE → REFUNDED), amount = paid minus platform commission, and that deduction must remain disclosed at checkout.
- Points: non-transferable, non-cashable, redeemable only against the operator's own services (cable/wifi). Never add merchandise redemption or transfer features.

## 7. REPORT FORMAT — exactly this, every round
1) synced-from hash  2) each item: DONE/NOT DONE (+ file:line for DONE)  3) raw gate outputs  4) suite count  5) `git diff --stat` paste  6) commit hash + "pushed to master, servers restarted, DB reset"

## 8. STANDING BUSINESS RULES (current, do not re-decide)
- Cancel window: 1 minute. Cancel allowed only while timer alive AND status ∈ {CONFIRMING, PENDING, ACCEPTED, PREPARING}. Ready-for-Pickup kills cancel even with time left.
- Stockist cancel: only before accepting (CONFIRMING/PENDING). After accept, committed.
- Orders reach the stockist queue immediately. Multi-store carts are pickup-only, one sub-order per store.
- No-show: 30-min grace → one reschedule → 20-min grace → auto-cancel (refund minus commission).
- Points reveal to the customer happens in the Delivered popup, not at checkout.
