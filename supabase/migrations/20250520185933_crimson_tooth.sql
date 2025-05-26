/*
  # Add Restaurant Segregation and Customer Features

  1. New Tables
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `logo_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Updates
    - Add restaurant_id to existing tables
    - Add phone_number to customers table
    - Add discount_rate to customers table
    - Update RLS policies for restaurant segregation

  3. Security
    - Add RLS policies for restaurant access
    - Update existing policies to include restaurant check
*/

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own restaurant"
  ON restaurants
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM restaurant_users WHERE restaurant_id = id
  ));

-- Create restaurant_users junction table
CREATE TABLE IF NOT EXISTS restaurant_users (
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (restaurant_id, user_id)
);

ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their restaurant assignments"
  ON restaurant_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add restaurant_id to existing tables
ALTER TABLE menu_sections ADD COLUMN restaurant_id uuid REFERENCES restaurants(id);
ALTER TABLE menu_items ADD COLUMN restaurant_id uuid REFERENCES restaurants(id);
ALTER TABLE customers ADD COLUMN restaurant_id uuid REFERENCES restaurants(id);
ALTER TABLE transactions ADD COLUMN restaurant_id uuid REFERENCES restaurants(id);
ALTER TABLE customer_categories ADD COLUMN restaurant_id uuid REFERENCES restaurants(id);

-- Add phone_number to customers
ALTER TABLE customers ADD COLUMN phone_number text;

-- Update RLS policies for restaurant segregation
CREATE POLICY "Users can only access their restaurant's menu sections"
  ON menu_sections
  FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can only access their restaurant's menu items"
  ON menu_items
  FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can only access their restaurant's customers"
  ON customers
  FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can only access their restaurant's transactions"
  ON transactions
  FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can only access their restaurant's customer categories"
  ON customer_categories
  FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- Function to set restaurant_id on insert
CREATE OR REPLACE FUNCTION set_restaurant_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.restaurant_id := (
    SELECT restaurant_id 
    FROM restaurant_users 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically set restaurant_id
CREATE TRIGGER set_menu_section_restaurant_id
  BEFORE INSERT ON menu_sections
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_id();

CREATE TRIGGER set_menu_item_restaurant_id
  BEFORE INSERT ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_id();

CREATE TRIGGER set_customer_restaurant_id
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_id();

CREATE TRIGGER set_transaction_restaurant_id
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_id();

CREATE TRIGGER set_customer_category_restaurant_id
  BEFORE INSERT ON customer_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_id();