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
