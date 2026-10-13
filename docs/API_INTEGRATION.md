# API integration

The frontend has **no mock server**. Every call of the User (`/app/*`), Expert (`/expert/*`) and Admin (`/admin/*`) workspaces goes to the Laravel backend at `VITE_API_BASE_URL` (see `.env.example`), with the `{status,message,data}` envelope, `Accept-Language`, `Idempotency-Key` and `expectedVersion` (409 = reload).

- Local backend: `VITE_API_BASE_URL=http://localhost:8000` (backend `php artisan migrate:fresh --seed --seeder=DemoSeeder`, accounts in the backend's `FRONTEND-V7-INTEGRATION.md`).
- Production: `VITE_API_BASE_URL=https://<backend-domain>`.
- Development only: with the backend's `PAYMENTS_DRIVER=fake`, checkout / Stripe onboarding answer with a `mock://` URL; the dev build then completes it through the backend's `/api/__mock/...` route. Production builds never do this.

`npm test` runs the node tests (KYC, expert profile and auth, admin authorization, user auth, expert proposal mapping).

## Trial / investor demo mode (`VITE_DEMO_MODE`)
Everything under `src/features/demo` renders only when `VITE_DEMO_MODE=true`:
- **Login pages (user / expert / admin):** "Fill a demo account" button, account list, first-visit walkthrough ("What's this?").
  `?demo=<email>` pre-fills a specific account.
- **"Where to go next" cards** (`DemoNextStep`): after inviting experts, while waiting for a proposal, after booking (user side),
  and on the expert request page (new request, proposal sent, awaiting payment/booking, session booked). Buttons sign out the target role
  and open its login with the account pre-filled.
- **Floating "Switch account" pill** (`DemoSwitcher`, mounted in `App.jsx`).
- **"Demo" badge** on experts (`isDemo` from the API) in the experts list and proposal tabs.
- The **general consultation** scope (`isGeneral`) is shown with a "General track" pill and a friendly note explaining why it appeared.
  This note is data-driven (not demo-gated) so a case never dead-ends.

For the real launch: unset `VITE_DEMO_MODE` (or `false`) and run `php artisan demo:disable` on the backend.
