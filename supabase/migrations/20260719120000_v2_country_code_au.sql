-- Allow Australia (AU) for customer + merchant country fields.
-- SMS/OTP for AU routes via Twilio (same path as FI).

alter table public.customers
  drop constraint if exists customers_country_code_check;

alter table public.customers
  add constraint customers_country_code_check
  check (country_code in ('NP', 'FI', 'AU'));

alter table public.merchants
  drop constraint if exists merchants_country_check;

alter table public.merchants
  add constraint merchants_country_check
  check (country in ('NP', 'FI', 'AU'));
