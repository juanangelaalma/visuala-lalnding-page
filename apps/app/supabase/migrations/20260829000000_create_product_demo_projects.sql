create type public.product_demo_project_status as enum ('draft', 'analyzing', 'storyboard_ready', 'generating', 'ready', 'rendering', 'rendered', 'failed');
create type public.product_demo_goal as enum ('product_launch', 'feature_launch', 'social_promo', 'landing_page_demo');
create type public.product_demo_duration as enum ('short', 'standard', 'extended');
create type public.product_demo_aspect_ratio as enum ('landscape', 'portrait', 'square');
create type public.product_demo_motion_style as enum ('clean_saas', 'dark_premium', 'bold_launch', 'minimal', 'startup_social');

create table public.product_demo_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  brief text not null default '',
  product_url text,
  feature_name text,
  target_audience text,
  goal public.product_demo_goal,
  duration public.product_demo_duration not null default 'standard',
  aspect_ratio public.product_demo_aspect_ratio not null default 'landscape',
  motion_style public.product_demo_motion_style,
  status public.product_demo_project_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_demo_projects_user_updated_at_idx on public.product_demo_projects(user_id, updated_at desc);
create trigger product_demo_projects_set_updated_at before update on public.product_demo_projects for each row execute function public.set_updated_at();
alter table public.product_demo_projects enable row level security;
create policy "Users manage their product demo projects" on public.product_demo_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
