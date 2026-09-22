-- Defines the first month in which a recurring entry affects financial totals.
ALTER TABLE public.recurring_expenses
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Preserve existing entries from their creation month.
UPDATE public.recurring_expenses
SET start_date = created_at::date
WHERE start_date IS NULL;

ALTER TABLE public.recurring_expenses
ALTER COLUMN start_date SET DEFAULT CURRENT_DATE,
ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.recurring_expenses
TO authenticated;

DROP POLICY IF EXISTS "Users can view their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can view their own recurring expenses"
ON public.recurring_expenses
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can insert their own recurring expenses"
ON public.recurring_expenses
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can update their own recurring expenses"
ON public.recurring_expenses
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can delete their own recurring expenses"
ON public.recurring_expenses
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS recurring_expenses_user_id_idx
ON public.recurring_expenses (user_id);