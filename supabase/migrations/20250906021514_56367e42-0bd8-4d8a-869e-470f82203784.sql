-- First, let's create a new table with the new schema
CREATE TABLE public.receipts_new (
  id TEXT NOT NULL PRIMARY KEY,  -- Changed from UUID to TEXT to use invoice number
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'tunai',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.receipts_new ENABLE ROW LEVEL SECURITY;

-- Copy existing data with invoice_number as id
INSERT INTO public.receipts_new (id, user_id, invoice_number, subtotal, discount, total, profit, payment_method, created_at, updated_at)
SELECT invoice_number, user_id, invoice_number, subtotal, discount, total, profit, payment_method, created_at, updated_at
FROM public.receipts;

-- Create new receipt_items table with TEXT foreign key
CREATE TABLE public.receipt_items_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id TEXT NOT NULL,  -- Changed from UUID to TEXT
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (receipt_id) REFERENCES public.receipts_new(id) ON DELETE CASCADE
);

-- Enable RLS on new receipt_items table
ALTER TABLE public.receipt_items_new ENABLE ROW LEVEL SECURITY;

-- Copy existing receipt_items data using invoice_number as foreign key
INSERT INTO public.receipt_items_new (receipt_id, product_id, product_name, quantity, unit_price, cost_price, total_price, profit, final_price, created_at)
SELECT r.invoice_number, ri.product_id, ri.product_name, ri.quantity, ri.unit_price, ri.cost_price, ri.total_price, ri.profit, ri.final_price, ri.created_at
FROM public.receipt_items ri
JOIN public.receipts r ON ri.receipt_id = r.id;

-- Drop old tables and rename new ones
DROP TABLE public.receipt_items;
DROP TABLE public.receipts;
ALTER TABLE public.receipts_new RENAME TO receipts;
ALTER TABLE public.receipt_items_new RENAME TO receipt_items;

-- Create RLS policies for receipts
CREATE POLICY "Users can view all receipts" 
ON public.receipts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts" 
ON public.receipts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for receipt_items
CREATE POLICY "Users can view all receipt items" 
ON public.receipt_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert receipt items" 
ON public.receipt_items 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();