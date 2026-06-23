# Customer PWA (`apps/customer`)

Local: [http://localhost:3000](http://localhost:3000)

## Run

From the repo root:

```sh
pnpm exec turbo dev --filter=customer
```

Copy shared env from [`.env.example`](../../.env.example) into `apps/customer/.env.local`.

## Reward OTP — local dev (no SMS)

Redemption uses SMS OTP (Sparrow for Nepal, Twilio for Finland). You do **not** need SMS credentials for local testing.

1. Leave `SPARROW_SMS_TOKEN` and `TWILIO_*` **empty** in `apps/customer/.env.local`.
2. Run the customer app in development (`pnpm exec turbo dev --filter=customer`).
3. Reach stamp target so a card is `pending_otp`, then open **Claim reward** (`/reward/[cardId]`).
4. Tap **Send verification code**.
5. In the **terminal running the customer app**, find a line like:

   ```text
   [dev:redemption-otp] +97798XXXXXXXX: 123456
   ```

6. Enter that 6-digit code in the app to get your redemption code.

The console fallback applies only when `NODE_ENV=development` and the SMS provider for the customer’s country is not configured. Production requires real Sparrow/Twilio credentials.

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
