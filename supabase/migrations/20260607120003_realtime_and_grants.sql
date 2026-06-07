-- YORewards Day 1 · Step 4/4 — Realtime + API grants
-- RLS policies go in the next migration (20260607130000_rls_policies.sql).

alter publication supabase_realtime add table public.stamp_sessions;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

grant execute on function public.increment_stamps(uuid, text) to authenticated;
grant execute on function public.void_stamp(uuid) to authenticated;
grant execute on function public.issue_stamp_manual(uuid) to authenticated;
grant execute on function public.complete_redemption(uuid) to authenticated;
