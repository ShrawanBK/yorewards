-- YORewards Day 1 · Step 1/4 — Postgres extensions
-- Runs first. Additive migrations only after init (Technical Doc §4.5).

create extension if not exists "pgcrypto";
