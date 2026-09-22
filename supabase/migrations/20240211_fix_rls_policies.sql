-- Add UPDATE and DELETE policies for cards and transactions

-- Cards
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
CREATE POLICY "Users can update their own cards" ON cards
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;
CREATE POLICY "Users can delete their own cards" ON cards
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Transactions
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid()::text = user_id::text);
