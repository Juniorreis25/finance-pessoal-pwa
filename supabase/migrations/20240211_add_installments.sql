-- Add columns for installments support
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS installment_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installment_number INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_installments INT DEFAULT NULL;

-- Create function to handle installment creation
CREATE OR REPLACE FUNCTION create_installment_transaction(
  p_user_id UUID,
  p_description TEXT,
  p_amount DECIMAL,
  p_category TEXT,
  p_date DATE,
  p_total_installments INT,
  p_card_id UUID DEFAULT NULL
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
  -- Floor to 2 decimal places: 500 / 3 = 166.66
  v_monthly_amount := FLOOR((p_amount / p_total_installments) * 100) / 100;
  
  -- The first installment gets the remainder: 500 - (166.66 * 2) = 166.68
  v_first_installment_amount := p_amount - (v_monthly_amount * (p_total_installments - 1));
  
  -- Loop to create N records
  FOR i IN 1..p_total_installments LOOP
    -- Calculate date: add (i-1) months to start date
    -- PostGreSQL allows interval arithmetic
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
      total_installments
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
      p_total_installments
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
