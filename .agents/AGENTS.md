# Workspace Rules

## 1. Avoid `window.confirm` in Web Applications
Native browser dialogs like `window.confirm` are fragile because modern web browsers or automated test environments (like Playwright, Puppeteer, or agent runtimes) often suppress them, leading to frozen states or silent failures.
- **Preferred Pattern**: Implement an inline two-step confirmation pattern. On first click, change the button style to warning/danger and text to "Tap again to confirm...". Revert back automatically after 3 seconds via timeout. On the second click, execute the action.

## 2. Real-Time Ticking Countdowns in React
When displaying timers, progress bars, or countdowns, do not rely on standard `Date.now()` directly in the render function as the value will remain frozen until another state change triggers a re-render.
- **Preferred Pattern**: Introduce a reactive `nowTick` state: `const [nowTick, setNowTick] = useState(Date.now());`. Set up a `setInterval` in a `useEffect` hook to update it every second. Always clean up the interval on unmount or when the view/context changes.

## 3. Backward-Compatible Backend Safety Mapping
When migrating domain-level state/status enums on the backend, old frontend builds or API clients might still send legacy statuses.
- **Preferred Pattern**: Implement a backend safety map middleware or translation layer in status update routes (e.g., `PATCH` / sync endpoints) that dynamically resolves deprecated enums (e.g., mapping `SHIPPED` to `READY_FOR_PICKUP` or `OUT_FOR_DELIVERY` based on order type) before validation checks.
