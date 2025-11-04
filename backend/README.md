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
2. Create a `products` table with the following schema:

```sql
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Add your Supabase URL and Anon Key to the `.env` file

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
