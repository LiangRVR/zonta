# Zonta API Documentation

## Base URL
```
http://localhost:3000
```

## Endpoints

### General

#### Get API Information
```
GET /
```

Returns API information and available endpoints.

**Response:**
```json
{
  "message": "Zonta Club of Naples API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "products": "/api/products",
    "productById": "/api/products/:id",
    "categories": "/api/products/categories",
    "productsByCategory": "/api/products/category/:category"
  }
}
```

#### Health Check
```
GET /health
```

Returns server health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

---

### Products

#### Get All Products
```
GET /api/products
```

Retrieves all products from the database.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "products": [
    {
      "id": "uuid-here",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "category": "Category Name",
      "image_url": "https://example.com/image.jpg",
      "stock": 100,
      "created_at": "2025-10-30T12:00:00.000Z"
    }
  ]
}
```

#### Get Product by ID
```
GET /api/products/:id
```

Retrieves a single product by its ID.

**Parameters:**
- `id` (string, required): Product UUID

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "uuid-here",
    "name": "Product Name",
    "description": "Product description",
    "price": 29.99,
    "category": "Category Name",
    "image_url": "https://example.com/image.jpg",
    "stock": 100,
    "created_at": "2025-10-30T12:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "Product not found"
}
```

#### Get Product Categories
```
GET /api/products/categories
```

Retrieves all unique product categories.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "categories": [
    "Apparel",
    "Accessories",
    "Books",
    "Gifts",
    "Stationery"
  ]
}
```

#### Get Products by Category
```
GET /api/products/category/:category
```

Retrieves all products in a specific category.

**Parameters:**
- `category` (string, required): Category name

**Response:**
```json
{
  "success": true,
  "category": "Apparel",
  "count": 5,
  "products": [
    {
      "id": "uuid-here",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "category": "Apparel",
      "image_url": "https://example.com/image.jpg",
      "stock": 100,
      "created_at": "2025-10-30T12:00:00.000Z"
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message (only in development mode)"
}
```

### 404 Not Found
```json
{
  "error": "Endpoint not found"
}
```

---

## Supabase Database Schema

### Products Table

```sql
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
```

### Orders Table

```sql
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
```

### Roles Table

```sql
CREATE TABLE public.roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role_name text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
```

### User Roles Table

```sql
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

**Relationships:**
- `user_roles.user_id` → `auth.users.id` (Supabase auth table)
- `user_roles.role_id` → `roles.id`
- To get a user's role name: `SELECT roles.role_name FROM user_roles JOIN roles ON user_roles.role_id = roles.id WHERE user_roles.user_id = '<user_id>'`

---

## Usage Examples

### JavaScript (Fetch API)

```javascript
// Get all products
fetch('http://localhost:3000/api/products')
  .then(response => response.json())
  .then(data => console.log(data.products))
  .catch(error => console.error('Error:', error));

// Get product by ID
fetch('http://localhost:3000/api/products/uuid-here')
  .then(response => response.json())
  .then(data => console.log(data.product))
  .catch(error => console.error('Error:', error));

// Get products by category
fetch('http://localhost:3000/api/products/category/Apparel')
  .then(response => response.json())
  .then(data => console.log(data.products))
  .catch(error => console.error('Error:', error));
```

### cURL

```bash
# Get all products
curl http://localhost:3000/api/products

# Get product by ID
curl http://localhost:3000/api/products/uuid-here

# Get categories
curl http://localhost:3000/api/products/categories

# Get products by category
curl http://localhost:3000/api/products/category/Apparel
```
