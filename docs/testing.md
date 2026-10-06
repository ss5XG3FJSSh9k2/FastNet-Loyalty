# How to run for testing

1. Always use `npm run dev` to start the application for development and testing. This command automatically configures the environment.
2. Never set environment variables by hand for testing. The launcher handles all necessary configuration (like `SEED_MODE=test`, `EMAIL_MOCK`, `SMS_MOCK`, and `R2_MOCK`).
3. Restarting the app resets the data to the preset. The database runs in-memory during test mode, meaning any data you create (orders, users, products) will disappear when the server is stopped, and the preset accounts will be restored on the next launch.

To start an empty application without the seed data (only for deliberate clean-slate checks), you can run `npm run dev:empty`.
