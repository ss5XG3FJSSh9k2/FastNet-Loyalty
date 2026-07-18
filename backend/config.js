// All configurable business rule constants — no magic numbers in app code.
// Change values here to adjust behaviour across the entire system.

module.exports = {
  // §F16 — Customer can cancel freely for this many minutes after order placement
  // DEMO_MODE Option: Set CANCEL_WINDOW_MINUTES to 1 for faster checkout-to-stockist transitions during live demos (default stays 3).
  CANCEL_WINDOW_MINUTES: 1,

  // §F17 — New orders sit in CONFIRMING state (not visible to stockist) for this many minutes
  CONFIRMING_HOLD_MINUTES: 3,

  // §F19 — Grace period after scheduled pickup slot before no-show alert fires
  NOSHW_GRACE_MINUTES: 30,

  // §F20 — Grace period after rescheduled slot before auto-cancel fires
  NOSHW_RESCHEDULE_GRACE_MINUTES: 20,

  // §F22 — No-show count threshold that triggers prepaid-pickup restriction
  MAX_NOSHOWS_BEFORE_RESTRICTION: 3,

  // §I — New-account burst detection window
  ACCOUNT_BURST_HOURS: 48,

  // §I — High-burst order threshold for new accounts
  ACCOUNT_BURST_ORDER_THRESHOLD: 3,

  // §I — Rapid cancel-loop detection window (minutes)
  RAPID_CANCEL_WINDOW_MINUTES: 60,

  // §I — Number of place+cancel cycles in the window to trigger a flag
  RAPID_CANCEL_THRESHOLD: 3,

  // §I — Repeat-pair multiplier vs region average (e.g. 3× the average)
  REPEAT_PAIR_MULTIPLIER: 3,

  // Delivery fee by region (region_id → fee in rupees)
  DELIVERY_FEE_BY_REGION: {
    r1: 40.00,
    r2: 30.00,
  },

  // Named pickup slot options offered to customers at checkout
  SLOT_OPTIONS: [
    'Morning (8AM–12PM)',
    'Afternoon (12PM–4PM)',
    'Evening (4PM–8PM)',
  ],

  // Default stockist operating hours (used when not set on stockist record)
  DEFAULT_OPENING_TIME: '08:00',
  DEFAULT_CLOSING_TIME: '20:00',
  DEFAULT_PREP_ETA_MINUTES: 10,
};
