CREATE OR REPLACE FUNCTION public.update_installment_series(
  p_user_id uuid,
  p_installment_id uuid,
  p_description text,
  p_amount numeric,
  p_category text,
  p_first_installment_date date,
  p_card_id uuid DEFAULT NULL,
  p_purchase_date date DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_count integer;
  v_min_number integer;
  v_max_number integer;
  v_distinct_count integer;
  v_row_count integer;
  v_monthly_amount numeric(10, 2);
  v_first_amount numeric(10, 2);
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR p_user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_installment_id IS NULL OR p_amount IS NULL OR p_amount <= 0
     OR p_first_installment_date IS NULL
     OR NULLIF(btrim(p_description), '') IS NULL
     OR NULLIF(btrim(p_category), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid installment data' USING ERRCODE = '22023';
  END IF;

  -- Lock this user's complete series before validating and updating it.
  PERFORM t.id
  FROM public.transactions AS t
  WHERE t.installment_id = p_installment_id
    AND t.user_id = (SELECT auth.uid())
  ORDER BY t.installment_number
  FOR UPDATE;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  SELECT count(*)::integer, min(t.installment_number), max(t.installment_number),
         count(DISTINCT t.installment_number)::integer
  INTO v_count, v_min_number, v_max_number, v_distinct_count
  FROM public.transactions AS t
  WHERE t.installment_id = p_installment_id
    AND t.user_id = (SELECT auth.uid())
    AND t.type = 'expense';

  IF v_count NOT BETWEEN 2 AND 48 OR v_row_count <> v_count
     OR v_min_number <> 1 OR v_max_number <> v_count
     OR v_distinct_count <> v_count
     OR EXISTS (
       SELECT 1
       FROM public.transactions AS t
       WHERE t.installment_id = p_installment_id
         AND t.user_id = (SELECT auth.uid())
         AND t.total_installments IS DISTINCT FROM v_count
     ) THEN
    RAISE EXCEPTION 'Installment series is incomplete or unavailable'
      USING ERRCODE = '22023';
  END IF;

  IF p_card_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.cards AS c
    WHERE c.id = p_card_id
      AND c.user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Card unavailable' USING ERRCODE = '23503';
  END IF;

  v_monthly_amount := floor((p_amount / v_count) * 100) / 100;
  v_first_amount := p_amount - (v_monthly_amount * (v_count - 1));

  UPDATE public.transactions AS t
  SET description = p_description || ' (' || t.installment_number || '/' || v_count || ')',
      amount = CASE WHEN t.installment_number = 1
        THEN v_first_amount ELSE v_monthly_amount END,
      category = p_category,
      date = (p_first_installment_date
        + ((t.installment_number - 1) || ' months')::interval)::date,
      card_id = p_card_id,
      purchase_date = p_purchase_date
  WHERE t.installment_id = p_installment_id
    AND t.user_id = (SELECT auth.uid())
    AND t.type = 'expense';

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count <> v_count THEN
    RAISE EXCEPTION 'Installment series changed during update'
      USING ERRCODE = '40001';
  END IF;

  RETURN v_row_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.update_installment_series(
  uuid, uuid, text, numeric, text, date, uuid, date
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.update_installment_series(
  uuid, uuid, text, numeric, text, date, uuid, date
) TO authenticated;
