# Zonta Club of Naples - Backend API

RESTful API backend for the Zonta Club of Naples website with Supabase integration for product management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your Supabase credentials:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

## API Endpoints

### General
- `GET /` - API welcome message and endpoint documentation
- `GET /health` - Health check endpoint

### Products (Supabase Integration)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a single product by ID
- `GET /api/products/categories` - Get all product categories
- `GET /api/products/category/:category` - Get products by category

For detailed API documentation, see [API.md](./API.md)

## Tech Stack

- Node.js
- Express.js
- Supabase (Database & Auth)
- CORS
- dotenv

## Project Structure

```
backend/
├── src/
│   ├── index.js                    # Express server entry point
│   ├── supabaseClient.js           # Supabase client configuration
│   ├── controllers/
│   │   └── productsController.js   # Products business logic
│   └── routes/
│       └── products.js             # Products API routes
├── config/                         # Configuration files
├── package.json                    # Dependencies
├── .env                            # Environment variables (not in git)
├── .gitignore
├── API.md                          # API documentation
└── README.md                       # This file
```

## Development

The API runs on port 3000 by default (configurable via `.env` file).

Use `npm run dev` for development with auto-reload (nodemon).

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Create the database tables with the following schema:

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
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
```

3. Add your Supabase URL, Anon Key, and Service Role Key to the `.env` file

For admin dashboard setup, see [ADMIN_QUICKSTART.md](../ADMIN_QUICKSTART.md)

## Testing the API

Once the server is running, you can test the endpoints:

```bash
# Test health check
curl http://localhost:3000/health

# Get all products
curl http://localhost:3000/api/products

# Get product categories
curl http://localhost:3000/api/products/categories
```

Or visit `http://localhost:3000/` in your browser to see all available endpoints.
