-- Create table for recurring expenses
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    day_of_month INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    active BOOLEAN DEFAULT TRUE,
    last_processed_date DATE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recurring expenses" ON recurring_expenses;
CREATE POLICY "Users can view their own recurring expenses" ON recurring_expenses
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own recurring expenses" ON recurring_expenses;
CREATE POLICY "Users can insert their own recurring expenses" ON recurring_expenses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own recurring expenses" ON recurring_expenses;
CREATE POLICY "Users can update their own recurring expenses" ON recurring_expenses
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own recurring expenses" ON recurring_expenses;
CREATE POLICY "Users can delete their own recurring expenses" ON recurring_expenses
    FOR DELETE USING (auth.uid()::text = user_id::text);
