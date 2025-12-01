# Supabase Setup Guide

This guide will help you set up Supabase for the Zonta Club of Naples project.

## Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Zonta Club Naples
   - **Database Password**: (choose a strong password)
   - **Region**: Select the closest region
4. Click "Create new project"

## Get Your Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

3. Add these to your `backend/.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Create the Products Table

1. Go to the **SQL Editor** in your Supabase dashboard
2. Run the following SQL to create the products table:

```sql
-- Create products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
ON products FOR SELECT
USING (active = true);

-- Create policy for authenticated users to manage products
CREATE POLICY "Allow authenticated users to insert"
ON products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update"
ON products FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete"
ON products FOR DELETE
USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_display_order ON products(display_order);
```

## Add Sample Products

Run this SQL to add some sample products:

```sql
INSERT INTO products (name, description, price, image, display_order) VALUES
  ('Zonta Tote Bag', 'Durable canvas tote bag with Zonta logo. Perfect for everyday use.', 25.00, 'https://uwdzcgsbmqoiexnolahw.supabase.co/storage/v1/object/public/products-images/bag.png', 0),
  ('Zonta T-Shirt', 'Comfortable cotton t-shirt featuring our mission statement.', 30.00, 'https://uwdzcgsbmqoiexnolahw.supabase.co/storage/v1/object/public/products-images/t-shirt.png', 0),
  ('Zonta Mug', 'Ceramic coffee mug with inspiring Zonta quote.', '15.00', 'https://uwdzcgsbmqoiexnolahw.supabase.co/storage/v1/object/public/products-images/mug.png', 0),
  ('Zonta Pin', 'Gold-plated enamel pin with Zonta International logo.', '10.00', 'https://uwdzcgsbmqoiexnolahw.supabase.co/storage/v1/object/public/products-images/pin.png', 0),
  ('Zonta Notebook', 'Hardcover journal with Zonta branding. 200 pages.', '20.00', 'https://uwdzcgsbmqoiexnolahw.supabase.co/storage/v1/object/public/products-images/notebook.png', 0),
  ('Zonta Cap', 'Adjustable baseball cap with embroidered logo.', '22.00', 'https://uwdzcgsbmqoiexnolahw.supabase.co/storage/v1/object/public/products-images/cap.png', 0);
```

## Configure Storage (Optional)

If you want to store product images:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `products`
3. Set the bucket to **Public**
4. Upload product images
5. Update the `image_url` field in your products table with the image URLs

Example:
```sql
UPDATE products
SET image_url = 'https://your-project.supabase.co/storage/v1/object/public/products/tote-bag.jpg'
WHERE id = 1;
```

## Enable Realtime (Optional)

To enable real-time updates for the products table:

1. Go to **Database** → **Replication**
2. Find the `products` table
3. Enable replication for the table

## Test the Connection

Once everything is set up, test the connection:

```bash
# Start your backend server
cd backend
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/products
```

You should see your products returned as JSON.

## Security Best Practices

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use Row Level Security (RLS)** - Already enabled in the setup script
3. **Rotate keys regularly** - Can be done in Supabase dashboard
4. **Use service role key only on server** - Never expose it to the frontend
5. **Implement authentication** - For admin operations like adding/editing products

## Database Schema Reference

### Complete Schema

```sql
-- Products table
CREATE TABLE public.products (
  id bigint NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Orders table
CREATE TABLE public.orders (
  id bigint NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  customer_email text NOT NULL,
  customer_name text,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending'::text,
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  shipping_address jsonb,
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Roles table (for admin access control)
CREATE TABLE public.roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role_name text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- Insert default roles
INSERT INTO public.roles (role_name) VALUES ('admin'), ('user');

-- User roles mapping table
CREATE TABLE public.user_roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  role_id bigint,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
```

### Relationships

- **user_roles.user_id** → **auth.users.id** (Supabase authentication table)
- **user_roles.role_id** → **roles.id**

### Querying User Roles

To get a user's role name:
```sql
SELECT roles.role_name
FROM user_roles
JOIN roles ON user_roles.role_id = roles.id
WHERE user_roles.user_id = '<user_uuid>';
```

Or using Supabase's relationship syntax:
```javascript
const { data } = await supabase
  .from('user_roles')
  .select('roles(role_name)')
  .eq('user_id', userId)
  .single();

// Access role name: data.roles.role_name
```

## Next Steps

- See [ADMIN_QUICKSTART.md](../ADMIN_QUICKSTART.md) for setting up the admin dashboard
- Add product image upload functionality
- Implement inventory management
- Add product search and filtering

## Troubleshooting

### Connection Issues
- Verify your Supabase URL and key are correct
- Check that your `.env` file is in the `backend/` directory
- Ensure Row Level Security policies allow read access

### Products Not Showing
- Check that products have `active = true`
- Verify the products table exists
- Check browser console for errors

### CORS Errors
- Ensure CORS is enabled in your Express app (already configured)
- Check that the frontend URL is correct in your `.env`

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
