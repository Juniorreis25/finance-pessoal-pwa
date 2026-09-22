-- Add purchase_date column to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS purchase_date DATE DEFAULT NULL;

-- Update the RPC function to include purchase_date
CREATE OR REPLACE FUNCTION create_installment_transaction(
  p_user_id UUID,
  p_description TEXT,
  p_amount DECIMAL,
  p_category TEXT,
  p_date DATE,
  p_total_installments INT,
  p_card_id UUID DEFAULT NULL,
  p_purchase_date DATE DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_monthly_amount DECIMAL(10, 2);
  v_first_installment_amount DECIMAL(10, 2);
  v_installment_id UUID;
  v_current_date DATE;
  i INT;
BEGIN
  -- Generate a unique group ID for this set of installments
  v_installment_id := uuid_generate_v4();
  
  -- Calculate split amounts (handling cents)
  v_monthly_amount := FLOOR((p_amount / p_total_installments) * 100) / 100;
  v_first_installment_amount := p_amount - (v_monthly_amount * (p_total_installments - 1));
  
  -- Loop to create N records
  FOR i IN 1..p_total_installments LOOP
    -- Calculate date: add (i-1) months to start date
    v_current_date := p_date + ((i - 1) || ' month')::INTERVAL;
    
    INSERT INTO transactions (
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
$$ LANGUAGE plpgsql;
