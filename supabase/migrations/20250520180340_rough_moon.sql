/*
  # Add Transaction Details Columns

  1. Updates
    - Add customer_name and table_number to transactions table
    - Add employee_name to transactions table
    - Update existing policies

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to transactions table
ALTER TABLE transactions
ADD COLUMN customer_name text,
ADD COLUMN table_number text,
ADD COLUMN employee_name text;