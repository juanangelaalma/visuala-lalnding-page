create type public.ai_generation_status as enum ('awaiting_credit','queued','submitting','unknown','processing','succeeded','failed','cancelled','dead_letter');
create type public.ai_generation_type as enum ('text','image','video','composition');
create type public.ai_provider as enum ('gemini','atlas','local');

create table public.ai_projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  product jsonb not null, creator text not null, duration_seconds integer not null check (duration_seconds in (12,18,25)),
  quality text not null check (quality in ('economy','standard','premium')), reference_assets text[] not null default '{}',
  status text not null default 'storyboard_processing' check (status in ('storyboard_processing','storyboard_ready','storyboard_failed','generating_scenes','composition_waiting','completed','failed')),
  idempotency_key text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,idempotency_key), unique(id,user_id)
);
create trigger ai_projects_set_updated_at before update on public.ai_projects for each row execute function public.set_updated_at();
create table public.ai_scenes (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ai_projects(id) on delete cascade,
  position integer not null check(position >= 0), title text not null, scene_type text not null check(scene_type in ('hook_light_motion','product_showcase','talking_to_camera','complex_hand_interaction','product_close_up','benefit','price_promo','cta','premium_render')),
  motion_complexity text not null check(motion_complexity in ('low','medium','high')), image_prompt text not null, video_prompt text not null, negative_prompt text not null,
  dialogue text not null default '', duration_seconds integer not null check(duration_seconds between 1 and 10), approved_image_generation_id uuid,
  created_at timestamptz not null default now(), unique(project_id,position), unique(id,project_id)
);
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ai_projects(id) on delete cascade,
  scene_id uuid, parent_generation_id uuid, type public.ai_generation_type not null,
  logical_model_key text not null, provider public.ai_provider not null, provider_model_id text not null, provider_generation_id text,
  status public.ai_generation_status not null default 'queued', attempt_number integer not null default 1 check(attempt_number > 0),
  worker_attempt_count integer not null default 0 check(worker_attempt_count >= 0), max_attempts integer not null default 5 check(max_attempts between 1 and 20),
  next_attempt_at timestamptz not null default now(), lease_owner uuid, lease_expires_at timestamptz, is_fallback boolean not null default false,
  prompt text, negative_prompt text, seed integer, input_assets text[] not null default '{}', output_assets text[] not null default '{}', provider_request jsonb not null default '{}', provider_response jsonb,
  resolution text check(resolution is null or resolution in ('720p','1080p')), requested_duration_seconds integer, billed_duration_seconds integer,
  estimated_cost_usd numeric, actual_cost_usd numeric, credits_charged integer not null default 0 check(credits_charged >= 0), credit_reservation_key text,
  idempotency_key text not null, error_code text, error_message text, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(),
  unique(project_id,idempotency_key), unique(id,project_id), unique(id,scene_id,project_id),
  foreign key(scene_id,project_id) references public.ai_scenes(id,project_id) on delete cascade,
  foreign key(parent_generation_id,project_id) references public.ai_generations(id,project_id),
  check((type='text' and scene_id is null) or type<>'text')
);
alter table public.ai_scenes add constraint ai_scenes_approved_generation_fk foreign key(approved_image_generation_id,id,project_id) references public.ai_generations(id,scene_id,project_id);
create index ai_generations_work_idx on public.ai_generations(next_attempt_at) where status in ('queued','submitting','processing');

alter table public.ai_projects enable row level security; alter table public.ai_scenes enable row level security; alter table public.ai_generations enable row level security;
revoke all on public.ai_projects,public.ai_scenes,public.ai_generations from anon,authenticated;
grant select,insert,update,delete on public.ai_projects,public.ai_scenes,public.ai_generations to service_role;

create table public.ai_credit_reservation_grants(reservation_key text not null, generation_id uuid not null references public.ai_generations(id), grant_id uuid not null references public.credit_grants(id), amount integer not null check(amount>0), primary key(reservation_key,grant_id));
revoke all on public.ai_credit_reservation_grants from public,anon,authenticated;

create or replace function public.reserve_ai_generation_credits(p_user_id uuid,p_project_id uuid,p_generation_id uuid,p_idempotency_key text,p_amount integer) returns bigint language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_balance bigint;v_remaining integer;v_take integer;g record;
begin
  if p_amount<=0 then raise exception 'INVALID_AMOUNT';end if;
  if not exists(select 1 from ai_projects where id=p_project_id and user_id=p_user_id) then raise exception 'PROJECT_NOT_OWNED';end if;
  perform 1 from ai_generations where id=p_generation_id and project_id=p_project_id for update;if not found then raise exception 'PROJECT_NOT_OWNED';end if;
  if exists(select 1 from credit_ledger_entries where user_id=p_user_id and idempotency_key=p_idempotency_key) then select balance_after into v_balance from credit_ledger_entries where user_id=p_user_id and idempotency_key=p_idempotency_key;update ai_generations set status='queued' where id=p_generation_id and status='awaiting_credit';return v_balance;end if;
  select balance into v_balance from credit_wallets where user_id=p_user_id for update;if v_balance<p_amount then raise exception 'INSUFFICIENT_CREDITS';end if;
  if exists(select 1 from credit_ledger_entries where user_id=p_user_id and idempotency_key=p_idempotency_key) then select balance_after into v_balance from credit_ledger_entries where user_id=p_user_id and idempotency_key=p_idempotency_key;update ai_generations set status='queued' where id=p_generation_id and status='awaiting_credit';return v_balance;end if;
  v_remaining:=p_amount;
  for g in select id,remaining_amount from credit_grants where user_id=p_user_id and remaining_amount>0 and expires_at>now() order by expires_at,id for update loop
    v_take:=least(v_remaining,g.remaining_amount);update credit_grants set remaining_amount=remaining_amount-v_take where id=g.id;
    insert into ai_credit_reservation_grants values(p_idempotency_key,p_generation_id,g.id,v_take);v_remaining:=v_remaining-v_take;exit when v_remaining=0;
  end loop;
  if v_remaining<>0 then raise exception 'INSUFFICIENT_CREDITS';end if;
  v_balance:=v_balance-p_amount;update credit_wallets set balance=v_balance,updated_at=now() where user_id=p_user_id;
  insert into credit_ledger_entries(user_id,entry_type,amount,balance_after,idempotency_key) values(p_user_id,'spend',-p_amount,v_balance,p_idempotency_key);
  update ai_generations set credits_charged=p_amount,credit_reservation_key=p_idempotency_key,status='queued' where id=p_generation_id;return v_balance;
end $$;
create or replace function public.fail_and_reverse_ai_generation(p_generation_id uuid,p_worker uuid,p_code text) returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_key text;v_user uuid;v_balance bigint;v_total integer;
begin
  select p.user_id,g.credit_reservation_key into v_user,v_key from ai_generations g join ai_projects p on p.id=g.project_id where g.id=p_generation_id and g.lease_owner=p_worker for update;if not found then return false;end if;
  if v_key is null then update ai_generations set status='failed',error_code=p_code,error_message='Provider request was not accepted',completed_at=now(),lease_owner=null,lease_expires_at=null where id=p_generation_id;return true;end if;
  select balance into v_balance from credit_wallets where user_id=v_user for update;select coalesce(sum(amount),0) into v_total from ai_credit_reservation_grants where reservation_key=v_key;
  update credit_grants cg set remaining_amount=cg.remaining_amount+x.amount from ai_credit_reservation_grants x where x.reservation_key=v_key and x.grant_id=cg.id;
  update credit_wallets set balance=balance+v_total,updated_at=now() where user_id=v_user;
  insert into credit_ledger_entries(user_id,entry_type,amount,balance_after,idempotency_key) values(v_user,'reversal',v_total,v_balance+v_total,'reversal:'||v_key);
  update ai_generations set credits_charged=0,credit_reservation_key=null,status='failed',error_code=p_code,error_message='Provider request was not accepted',completed_at=now(),lease_owner=null,lease_expires_at=null where id=p_generation_id;delete from ai_credit_reservation_grants where reservation_key=v_key;return true;
end $$;

create or replace function public.claim_ai_generation_work(p_worker uuid,p_limit integer default 10,p_lease_seconds integer default 90) returns setof public.ai_generations language sql security definer set search_path=pg_catalog,public as $$
  with stale_submissions as (
    update ai_generations set status='unknown',error_code='SUBMISSION_LEASE_EXPIRED',error_message='Submission outcome is unknown',completed_at=now(),lease_owner=null,lease_expires_at=null
    where provider='atlas' and status='submitting' and lease_expires_at<now() returning id
  ), picked as (select id from ai_generations where provider='atlas' and status in ('queued','processing') and credits_charged>0 and next_attempt_at<=now() and (lease_expires_at is null or lease_expires_at<now()) order by created_at for update skip locked limit least(p_limit,25))
  update ai_generations g set lease_owner=p_worker,lease_expires_at=now()+make_interval(secs=>p_lease_seconds),worker_attempt_count=worker_attempt_count+1,status=case when provider_generation_id is null then 'submitting'::ai_generation_status else 'processing'::ai_generation_status end,started_at=coalesce(started_at,now()) from picked where g.id=picked.id returning g.*
$$;
create or replace function public.record_ai_work_failure(p_id uuid,p_worker uuid,p_code text,p_message text,p_unknown_after_send boolean default false) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin update ai_generations set status=case when p_unknown_after_send then 'unknown'::ai_generation_status when worker_attempt_count>=max_attempts then 'dead_letter'::ai_generation_status else 'queued'::ai_generation_status end,error_code=p_code,error_message=left(p_message,300),next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,worker_attempt_count))),lease_owner=null,lease_expires_at=null,completed_at=case when worker_attempt_count>=max_attempts or p_unknown_after_send then now() end where id=p_id and lease_owner=p_worker;end $$;
revoke all on function public.reserve_ai_generation_credits(uuid,uuid,uuid,text,integer),public.fail_and_reverse_ai_generation(uuid,uuid,text),public.claim_ai_generation_work(uuid,integer,integer),public.record_ai_work_failure(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.reserve_ai_generation_credits(uuid,uuid,uuid,text,integer),public.fail_and_reverse_ai_generation(uuid,uuid,text),public.claim_ai_generation_work(uuid,integer,integer),public.record_ai_work_failure(uuid,uuid,text,text,boolean) to service_role;
