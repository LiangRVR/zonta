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

The `products` table should have the following schema:

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
