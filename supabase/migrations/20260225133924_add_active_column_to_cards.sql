-- Migration to add active column to cards table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='active') THEN
        ALTER TABLE public.cards ADD COLUMN active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
