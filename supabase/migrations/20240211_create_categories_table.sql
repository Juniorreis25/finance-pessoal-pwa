-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT, -- Optional: for UI icons
    color TEXT, -- Optional: for UI colors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique category names per user per type
    UNIQUE(user_id, name, type)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Optional: Insert default categories for new users via a trigger 
-- (Or just handle it in the application layer for simplicity)

-- Add Foreign Key to Transactions (Optional migration step, keeping flexibility)
-- For now, we will keep 'category' as TEXT in transactions to avoid breaking existing data instantly,
-- but the App should now prefer using values from this table.
-- In a strict migration, we would:
-- 1. Add category_id to transactions
-- 2. Link existing text categories to new IDs
-- 3. Drop the text column.

-- For this Clone/MVP, we'll suggest just adding the table to support the "feature"
