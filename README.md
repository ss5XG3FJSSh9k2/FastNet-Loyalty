# FastNet Loyalty Platform

A modern loyalty and fulfillment system built for rural ISPs (Internet Service Providers) and local merchants (stockists). Subscribers earn points through local grocery/merchant purchases, which they can redeem for bill discounts or speed boosts with the ISP.

## Features
- **Trilingual Localization:** Support for English, Hindi (हिंदी), and Bengali (বাংলা) out of the box.
- **Translucent UI:** Sleek, modern dark-themed aesthetics utilizing Noto Sans and Plus Jakarta Sans.
- **Split Settlement:** Automatic calculations dividing payouts between local shopkeepers and the platform.
- **Fulfillment Workflows:** Integrated store pickup and home delivery pipelines with post-checkout lock protection.
- **Simulation Suite:** Offline synchronization simulation and WhatsApp message mockup overlay.

## Installation & Setup

1. **Install Dependencies:**
   Run from the project root:
   ```bash
   npm install
   ```

2. **Start Development Servers:**
   Launch both the Express backend and Vite frontend concurrently:
   ```bash
   npm run dev
   ```
   - **Frontend:** http://localhost:5173/
   - **Backend API:** http://localhost:3001/

## Running the Regression Suite

Run the automated integration tests from the root directory:
```bash
node backend/tests/regression.js
```

## Demo Credentials

| Role | Username / Phone | Password / OTP | Notes |
| :--- | :--- | :--- | :--- |
| **Customer** | `9876543210` | `123456` | Standard rural subscriber |
| **Stockist** | `7654321098` | `123456` | Local merchant (Madan Grocers) |
| **Admin** | *Accessible via role tab* | *None required* | System operator portal |
