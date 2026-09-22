-- Lock down every user-owned table exposed through the Supabase Data API.
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.cards,
  public.transactions,
  public.categories,
  public.recurring_expenses,
  public.user_profiles
FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.cards,
  public.transactions,
  public.categories,
  public.recurring_expenses,
  public.user_profiles
TO authenticated, service_role;

-- Cards: each signed-in user may manage only their own cards.
DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.cards;

CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own cards"
ON public.cards FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own cards"
ON public.cards FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own cards"
ON public.cards FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Transactions must belong to the signed-in user and may reference only their cards.
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    card_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.cards AS c
      WHERE c.id = transactions.card_id
        AND c.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    card_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.cards AS c
      WHERE c.id = transactions.card_id
        AND c.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Categories: keep category data private to its owner.
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories"
ON public.categories FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Recurring expenses: each operation is limited to the current user.
DROP POLICY IF EXISTS "Users can view their own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can insert their own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can update their own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can delete their own recurring expenses" ON public.recurring_expenses;

CREATE POLICY "Users can view their own recurring expenses"
ON public.recurring_expenses FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own recurring expenses"
ON public.recurring_expenses FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own recurring expenses"
ON public.recurring_expenses FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
ON public.recurring_expenses FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Profiles: only the owner may read or change their profile.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.user_profiles FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- The application calls the eight-argument version. Remove the obsolete overload,
-- which otherwise creates an unnecessary PostgREST RPC entry point.
DROP FUNCTION IF EXISTS public.create_installment_transaction(
  uuid, text, numeric, text, date, integer, uuid
);

CREATE OR REPLACE FUNCTION public.create_installment_transaction(
  p_user_id uuid,
  p_description text,
  p_amount numeric,
  p_category text,
  p_date date,
  p_total_installments integer,
  p_card_id uuid DEFAULT NULL,
  p_purchase_date date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_monthly_amount numeric(10, 2);
  v_first_installment_amount numeric(10, 2);
  v_installment_id uuid;
  v_current_date date;
  i integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR p_user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_total_installments IS NULL OR p_total_installments NOT BETWEEN 2 AND 48 THEN
    RAISE EXCEPTION 'Installment count must be between 2 and 48'
      USING ERRCODE = '22023';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_date IS NULL
     OR NULLIF(btrim(p_description), '') IS NULL
     OR NULLIF(btrim(p_category), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid installment data' USING ERRCODE = '22023';
  END IF;

  IF p_card_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.cards AS c
    WHERE c.id = p_card_id
      AND c.user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Card unavailable' USING ERRCODE = '23503';
  END IF;

  v_installment_id := extensions.uuid_generate_v4();
  v_monthly_amount := floor((p_amount / p_total_installments) * 100) / 100;
  v_first_installment_amount := p_amount
    - (v_monthly_amount * (p_total_installments - 1));

  FOR i IN 1..p_total_installments LOOP
    v_current_date := (p_date + ((i - 1) || ' months')::interval)::date;

    INSERT INTO public.transactions (
      user_id,
      description,
      amount,
      category,
      date,
      type,
      card_id,
      installment_id,
      installment_number,
      total_installments,
      purchase_date
    ) VALUES (
      p_user_id,
      p_description || ' (' || i || '/' || p_total_installments || ')',
      CASE WHEN i = 1 THEN v_first_installment_amount ELSE v_monthly_amount END,
      p_category,
      v_current_date,
      'expense',
      p_card_id,
      v_installment_id,
      i,
      p_total_installments,
      p_purchase_date
    );
  END LOOP;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_installment_transaction(
  uuid, text, numeric, text, date, integer, uuid, date
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_installment_transaction(
  uuid, text, numeric, text, date, integer, uuid, date
) TO authenticated;
