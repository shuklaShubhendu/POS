/*
  # Add Customer Management Features

  1. Updates
    - Add loyalty_points to customers table
    - Add customer_notes table for tracking interactions
    - Add customer_categories table for segmentation
    - Add views for customer analytics

  2. Security
    - Update RLS policies for new tables
    - Add functions for loyalty points calculation
*/

-- Add loyalty_points to customers
ALTER TABLE customers 
ADD COLUMN loyalty_points integer DEFAULT 0;

-- Create customer_notes table
CREATE TABLE customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON customer_notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access to admin and manager users" ON customer_notes
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Create customer_categories table
CREATE TABLE customer_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_spent numeric DEFAULT 0,
  discount_rate numeric DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON customer_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access to admin users" ON customer_categories
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add category_id to customers
ALTER TABLE customers
ADD COLUMN category_id uuid REFERENCES customer_categories(id) ON DELETE SET NULL;

-- Create function to update customer category based on total spent
CREATE OR REPLACE FUNCTION update_customer_category()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET category_id = (
    SELECT id
    FROM customer_categories
    WHERE min_spent <= NEW.total_spent
    ORDER BY min_spent DESC
    LIMIT 1
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update customer category
CREATE TRIGGER update_customer_category_trigger
  AFTER UPDATE OF total_spent ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_category();

-- Create view for customer analytics
CREATE VIEW customer_analytics AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.total_spent,
  c.loyalty_points,
  cc.name as category_name,
  cc.discount_rate,
  COUNT(t.id) as total_transactions,
  AVG(t.final_amount) as average_transaction_amount,
  MAX(t.created_at) as last_transaction_date
FROM customers c
LEFT JOIN customer_categories cc ON c.category_id = cc.id
LEFT JOIN transactions t ON c.id = t.customer_id
GROUP BY c.id, cc.id;

-- Add default customer categories
INSERT INTO customer_categories (name, min_spent, discount_rate) VALUES
  ('Bronze', 0, 0),
  ('Silver', 500, 5),
  ('Gold', 1000, 10),
  ('Platinum', 2000, 15);