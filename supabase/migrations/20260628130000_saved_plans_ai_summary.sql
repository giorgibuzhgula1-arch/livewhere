-- AI-generated plan summary (2-3 sentences) for saved retirement plans.

alter table public.saved_retirement_plans
  add column if not exists ai_summary text;
