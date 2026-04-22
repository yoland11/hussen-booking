create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) >= 2),
  phone text not null check (char_length(trim(phone)) >= 7),
  booking_date date not null,
  service_type text check (service_type is null or service_type in ('عيد ميلاد', 'زفاف', 'جلسة')),
  session_size text,
  location_type text check (location_type is null or location_type in ('داخلي', 'خارجي', 'قاعة')),
  staff_gender text check (staff_gender is null or staff_gender in ('نسائي', 'رجالي')),
  extra_details text,
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0 and paid_amount <= total_amount),
  remaining_amount numeric(12, 2) generated always as (greatest(total_amount - paid_amount, 0)) stored,
  payment_status text check (payment_status is null or payment_status in ('واصل', 'غير واصل', 'جزئي')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bookings alter column service_type drop not null;
alter table public.bookings alter column session_size drop not null;
alter table public.bookings alter column location_type drop not null;
alter table public.bookings alter column staff_gender drop not null;
alter table public.bookings alter column payment_status drop not null;

alter table public.bookings drop constraint if exists bookings_service_type_check;
alter table public.bookings drop constraint if exists bookings_location_type_check;
alter table public.bookings drop constraint if exists bookings_staff_gender_check;
alter table public.bookings drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_service_type_check
  check (service_type is null or service_type in ('عيد ميلاد', 'زفاف', 'جلسة'));

alter table public.bookings
  add constraint bookings_location_type_check
  check (location_type is null or location_type in ('داخلي', 'خارجي', 'قاعة'));

alter table public.bookings
  add constraint bookings_staff_gender_check
  check (staff_gender is null or staff_gender in ('نسائي', 'رجالي'));

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status is null or payment_status in ('واصل', 'غير واصل', 'جزئي'));

create table if not exists public.admin_login_rate_limits (
  identifier text primary key,
  attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  push_subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('today', 'tomorrow')),
  channel text not null check (channel in ('web_push')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (booking_id, push_subscription_id, reminder_kind, channel)
);

create index if not exists bookings_booking_date_idx on public.bookings (booking_date);
create index if not exists bookings_customer_name_idx on public.bookings (customer_name);
create index if not exists bookings_phone_idx on public.bookings (phone);
create index if not exists admin_login_rate_limits_locked_until_idx on public.admin_login_rate_limits (locked_until);
create index if not exists push_subscriptions_created_at_idx on public.push_subscriptions (created_at);
create index if not exists notification_deliveries_booking_kind_idx
  on public.notification_deliveries (booking_id, reminder_kind);
create index if not exists notification_deliveries_subscription_idx
  on public.notification_deliveries (push_subscription_id);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

drop trigger if exists admin_login_rate_limits_set_updated_at on public.admin_login_rate_limits;
create trigger admin_login_rate_limits_set_updated_at
before update on public.admin_login_rate_limits
for each row
execute function public.set_updated_at();

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

alter table public.bookings enable row level security;
alter table public.admin_login_rate_limits enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "No direct anonymous access to bookings" on public.bookings;
create policy "No direct anonymous access to bookings"
on public.bookings
for all
to anon
using (false)
with check (false);

drop policy if exists "No direct anonymous access to admin_login_rate_limits" on public.admin_login_rate_limits;
create policy "No direct anonymous access to admin_login_rate_limits"
on public.admin_login_rate_limits
for all
to anon
using (false)
with check (false);

drop policy if exists "No direct anonymous access to push_subscriptions" on public.push_subscriptions;
create policy "No direct anonymous access to push_subscriptions"
on public.push_subscriptions
for all
to anon
using (false)
with check (false);

drop policy if exists "No direct anonymous access to notification_deliveries" on public.notification_deliveries;
create policy "No direct anonymous access to notification_deliveries"
on public.notification_deliveries
for all
to anon
using (false)
with check (false);
