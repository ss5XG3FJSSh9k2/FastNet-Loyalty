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

  // Max delivery fee limit for admin configuration
  DELIVERY_FEE_MAX_RUPEES: 500,

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
  
  // §BF20 — OTP rate limiting constants
  OTP_RATE_LIMIT_SHORT_WINDOW_MS: 15 * 60 * 1000,
  OTP_RATE_LIMIT_SHORT_MAX: 5,
  OTP_RATE_LIMIT_HOURLY_WINDOW_MS: 60 * 60 * 1000,
  OTP_RATE_LIMIT_HOURLY_MAX: 20,

  OTP_TTL_MS: 5 * 60 * 1000,
  OTP_MAX_ATTEMPTS: 5,
  CAPTCHA_MIN_SCORE: 0.5,

  // §BF-GR-TIME — Generic rewards constants
  GENERIC_REWARD_TIMEZONE: 'Asia/Kolkata',
  GENERIC_REWARD_COOLDOWN_MIN_DAYS: 1,
  GENERIC_REWARD_COOLDOWN_MAX_DAYS: 3650,
  KYC_DOC_URL_TTL_SECONDS: 300,

  MAX_ITEM_QUANTITY_PER_LINE: 99,
  REWARD_NAME_MAX_LENGTH: 80,
  REWARD_DESCRIPTION_MAX_LENGTH: 300,
  REWARD_POINT_COST_MAX: 100000,
  REWARD_VALUE_MAX_RUPEES: 100000,
  MANUAL_CREDIT_MAX_POINTS: 1000,
  PRODUCT_PRICE_MAX_RUPEES: 100000,
  PRODUCT_STOCK_MAX: 100000,
  PRODUCT_NAME_MAX_LENGTH: 120,
};