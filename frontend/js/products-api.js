/**
 * Zonta Products API Client
 *
 * Example usage for the frontend to fetch products from the backend API
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fetch all products
 */
async function getAllProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Fetch a single product by ID
 */
async function getProductById(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Fetch all product categories
 */
async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Fetch products by category
 */
async function getProductsByCategory(category) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

/**
 * Display products on the page
 */
async function displayProducts() {
  try {
    const products = await getAllProducts();
    const container = document.getElementById('products-container');

    if (!container) {
      console.error('Products container not found');
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create product cards
    products.forEach(product => {
      const productCard = createProductCard(product);
      container.appendChild(productCard);
    });

    console.log(`Displayed ${products.length} products`);
  } catch (error) {
    console.error('Error displaying products:', error);
    // Show error message to user
    const container = document.getElementById('products-container');
    if (container) {
      container.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
    }
  }
}

/**
 * Create a product card element
 */
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-image">${product.image || '📦'}</div>
    <h3 class="product-name">${product.name}</h3>
    <p class="product-description">${product.description || ''}</p>
    <p class="product-price">$${product.price.toFixed(2)}</p>
    <button class="add-to-cart-btn" data-product-id="${product.id}">
      Add to Cart
    </button>
  `;

  // Add click handler for the button
  const button = card.querySelector('.add-to-cart-btn');
  button.addEventListener('click', () => addToCart(product));

  return card;
}

/**
 * Add product to cart (placeholder - implement your cart logic)
 */
function addToCart(product) {
  console.log('Adding to cart:', product);
  // Implement your cart logic here
  alert(`Added "${product.name}" to cart!`);
}

/**
 * Initialize the products page
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load and display products when the page loads
  displayProducts();
});

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllProducts,
    getProductById,
    getCategories,
    getProductsByCategory,
    displayProducts
  };
}
