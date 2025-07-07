-- Create the categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Create the trigger for categories table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at
            BEFORE UPDATE ON categories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

INSERT INTO categories (name, description, icon, color) VALUES
('Dining', 'Restaurant and food expenses', 'restaurant', '#FF8A80'),
('Groceries', 'Supermarket and grocery store purchases', 'shopping_cart', '#A7FFEB'),
('Utilities', 'Electricity, water, gas bills', 'power_settings_new', '#B39DDB'),
('Entertainment', 'Movies, streaming services, events', 'movie', '#FFAB91'),
('Health', 'Medical expenses and health products', 'medical_services', '#CE93D8'),
('Subscription', 'Monthly subscription services', 'subscriptions', '#90CAF9'),
('Auto & Transport', 'Car expenses and public transport', 'directions_car', '#A5D6A7'),
('Credit Card Payment', 'Credit card payments and fees', 'credit_card', '#FF8A80'),
('General Goods', 'Miscellaneous purchases', 'shopping_bag', '#FFF3E0'),
('Phone', 'Mobile phone bills and expenses', 'phone', '#90A4AE'),
('Home & Garden', 'Home improvement and gardening', 'home', '#B39DDB'),
('Home Loan', 'Mortgage payments and home loans', 'account_balance', '#90A4AE'),
('Income', 'Incoming payments and deposits', 'attach_money', '#A5D6A7'),
('Transfer', 'Bank transfers and money transfers', 'swap_horiz', '#90CAF9'),
('Fidelity Transfer', 'Investment account transfers', 'swap_vert', '#B39DDB'),
('Kid Cash', 'Children-related expenses', 'child_care', '#FFF3E0'),
('Moving Expense', 'Moving and relocation costs', 'local_moving', '#90CAF9'),
('Combined Insurance', 'Insurance premiums and costs', 'insurance', '#CE93D8'),
('Learning', 'Education and learning expenses', 'school', '#90A4AE'),
('Other', 'Uncategorized expenses', 'more_horiz', '#BDBDBD');
