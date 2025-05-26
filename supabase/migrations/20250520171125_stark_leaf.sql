/*
  # Initial Schema Setup

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `discount_rate` (numeric, default 0)
      - `total_spent` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `total_amount` (numeric)
      - `discount_amount` (numeric, default 0)
      - `final_amount` (numeric)
      - `payment_method` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transaction_items`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, foreign key)
      - `menu_item_id` (uuid, foreign key)
      - `quantity` (integer)
      - `price` (numeric)
      - `notes` (text)
    
    - `menu_items`
      - `id` (uuid, primary key)
      - `section_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `available` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `menu_sections`
      - `id` (uuid, primary key)
      - `name` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create menu_sections table
CREATE TABLE menu_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON menu_sections
  FOR SELECT USING (true);

CREATE POLICY "Allow write access to admin users" ON menu_sections
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create menu_items table
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES menu_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Allow write access to admin users" ON menu_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  discount_rate numeric DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  total_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access to admin and manager users" ON customers
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount numeric NOT NULL CHECK (final_amount >= 0),
  payment_method text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access to authenticated users" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access to admin and manager users" ON transactions
  FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Create transaction_items table
CREATE TABLE transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  notes text
);

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON transaction_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access to authenticated users" ON transaction_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update customer total_spent
CREATE OR REPLACE FUNCTION update_customer_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_spent = (
      SELECT COALESCE(SUM(final_amount), 0)
      FROM transactions
      WHERE customer_id = NEW.customer_id
      AND status = 'completed'
    )
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update customer total_spent after transaction
CREATE TRIGGER update_customer_total_spent_after_transaction
  AFTER INSERT OR UPDATE
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_total_spent();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_menu_sections_updated_at
  BEFORE UPDATE ON menu_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();