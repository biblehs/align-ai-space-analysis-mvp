alter table public.analyses
add column if not exists billing_provider text,
add column if not exists billing_customer_id text,
add column if not exists billing_subscription_id text,
add column if not exists billing_checkout_id text,
add column if not exists billing_order_id text,
add column if not exists billing_product_id text,
add column if not exists billing_status text;

create unique index if not exists analyses_billing_checkout_id_key
on public.analyses (billing_checkout_id)
where billing_checkout_id is not null;

create unique index if not exists analyses_billing_order_id_key
on public.analyses (billing_order_id)
where billing_order_id is not null;

create index if not exists analyses_billing_customer_id_idx
on public.analyses (billing_customer_id, paid_at desc)
where billing_customer_id is not null;

create index if not exists analyses_billing_status_idx
on public.analyses (billing_status, created_at desc)
where billing_status is not null;

update public.analyses
set
  billing_provider = coalesce(billing_provider, case when stripe_session_id is not null then 'stripe' else billing_provider end),
  billing_checkout_id = coalesce(billing_checkout_id, stripe_session_id),
  billing_status = coalesce(
    billing_status,
    case
      when paid then 'paid'
      when stripe_session_id is not null then 'checkout_pending'
      else billing_status
    end
  )
where stripe_session_id is not null
   or paid = true;
