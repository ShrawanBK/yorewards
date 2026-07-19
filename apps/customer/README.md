# Customer PWA (`apps/customer`)

Local: [http://localhost:3000](http://localhost:3000)

## Run

From the repo root:

```sh
pnpm exec turbo dev --filter=customer
```

The dev server binds to `0.0.0.0:3000`, so you can open it on a phone via your PC’s LAN IP: `http://192.168.68.104:3000`. That IP must appear in `next.config.ts` → `allowedDevOrigins` (update both if DHCP changes your address). Phone and PC must be on the same Wi‑Fi; allow port **3000** through the Windows firewall if needed.

Copy shared env from [`.env.example`](../../.env.example) into `apps/customer/.env.local`.

### Login on a phone (local dev)

- Use the **LAN IP**, not `localhost` — on the phone, `localhost` means the phone itself.
- After tapping **Continue**, the terminal should show a **POST** (not `GET /login?country=…&phoneLocal=…`). Query params on GET mean the form fell back without JavaScript; restart dev and hard-refresh the page.
- If login succeeds but you bounce back to `/login`, check the terminal for `[supabase] Failed to set auth cookies` and ensure `NEXT_PUBLIC_SUPABASE_URL` / keys are set in `.env.local`.

## Reward / signup OTP — local dev (no SMS)

Signup and redemption use SMS OTP (Sparrow for Nepal, Twilio for Finland; Twilio also covers NP if Sparrow is unset). You do **not** need SMS credentials for local testing.

1. Leave `SPARROW_SMS_TOKEN` and `TWILIO_*` **empty** in `apps/customer/.env.local`.
2. Run the customer app in development (`pnpm exec turbo dev --filter=customer`).
3. **Signup:** new phone → onboarding → send code → find `[dev:signup-otp]` in the terminal.
4. **Reward:** reach stamp target → Claim reward → Send code → find `[dev:redemption-otp]` in the terminal.
5. Enter that 6-digit code in the app.

With Twilio configured, real SMS is sent (FI always; NP when Sparrow is unset). Production requires Sparrow and/or Twilio credentials.

## Full loop E2E (Day 7 sign-off)

Run **customer** (`:3000`), **merchant** (`:3001`), and **admin** (`:3002`) together. Use a demo merchant with an active loyalty card and branch QR.

| Step | App | Action |
| ---- | --- | ------ |
| 1 | Customer | New phone → onboarding → empty wallet |
| 2 | Customer | Scan branch QR (or open `/scan?m=&c=&l=` deep link) |
| 3 | Merchant | Approve stamp in Realtime queue |
| 4 | Customer | Pending → success → wallet shows card + stamp count |
| 5 | Customer | Repeat until `pending_otp` / “Reward ready” banner |
| 6 | Customer | Claim reward → dev OTP in terminal → 6-char code |
| 7 | Merchant | `/merchant/redeem` → confirm code |
| 8 | Both | Card starts new cycle; overflow stamps carry (e.g. 12/10 → cycle 2 at 2/10) |
| 9 | Admin | Suspend customer → scan blocked with `status_reason` when set |

**Ports:** customer `3000`, merchant `3001`, admin `3002`.

**Device:** Test QR scan on a real iPhone (Safari) before launch — camera permissions and `html5-qrcode` behave differently than desktop Chrome.
