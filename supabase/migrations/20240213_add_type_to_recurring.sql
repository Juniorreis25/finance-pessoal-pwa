-- Add type column to recurring_expenses
ALTER TABLE recurring_expenses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense'));

-- Update RLS policies names if necessary (optional, but good for clarity)
-- Existing policies use the table name, so they still work.
