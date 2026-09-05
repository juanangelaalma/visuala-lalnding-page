create table public.product_demo_scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.product_demo_projects(id) on delete cascade,
  position integer not null check (position >= 0),
  title text not null,
  headline text not null,
  description text not null,
  visual text not null,
  duration_seconds integer not null check (duration_seconds between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, position)
);

create index product_demo_scenes_project_position_idx on public.product_demo_scenes(project_id, position);
create trigger product_demo_scenes_set_updated_at before update on public.product_demo_scenes for each row execute function public.set_updated_at();
alter table public.product_demo_scenes enable row level security;
create policy "Users manage their product demo scenes" on public.product_demo_scenes for all using (exists (select 1 from public.product_demo_projects project where project.id = project_id and project.user_id = auth.uid())) with check (exists (select 1 from public.product_demo_projects project where project.id = project_id and project.user_id = auth.uid()));
