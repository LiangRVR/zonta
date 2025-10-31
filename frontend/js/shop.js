// E-commerce functionality for Zonta Shop
const API_URL = 'http://localhost:3000'; // Change this for production
let cart = [];
let products = [];

// DOM Elements
const cartButton = document.getElementById('cartButton');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const customerEmail = document.getElementById('customerEmail');
const productsGrid = document.getElementById('productsGrid');
const productsLoading = document.getElementById('productsLoading');

// Fetch products from backend API
async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    products = data.products || [];

    console.log(`Loaded ${products.length} products from API`);
    displayProducts();
  } catch (error) {
    console.error('Error fetching products:', error);

    // Show error message to user
    productsLoading.innerHTML = `
      <div class="error-message">
        <p style="font-size: 1.5rem;">⚠️</p>
        <p>Unable to load products</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">
          Please make sure the backend server is running on ${API_URL}
        </p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">
          Retry
        </button>
      </div>
    `;

    // Keep products array empty or use fallback
    products = [];
  }
}

// Display products
function displayProducts() {
  productsLoading.style.display = 'none';
  productsGrid.style.display = 'grid';

  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="font-size: 1.2rem; color: #666;">No products available at the moment.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products
    .filter(p => p.active)
    .map(product => {
      // Check if image is a URL (starts with http:// or https://)
      const isImageUrl = product.image && (product.image.startsWith('http://') || product.image.startsWith('https://'));

      return `
        <div class="product-card">
          <div class="product-image">
            ${isImageUrl
              ? `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\\'product-placeholder\\'>📦</div>'" />`
              : `<div class="product-placeholder">${product.image || '📦'}</div>`
            }
          </div>
          <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <div class="product-footer">
              <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
              <button class="add-to-cart-btn" onclick="window.addToCart(${product.id}, event)">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Add to cart
window.addToCart = function(productId, event) {
  const product = products.find(p => p.id === productId);
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart();

  // Visual feedback
  if (event) {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Added! ✓';
    btn.style.background = '#4caf50';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1000);
  }
};

// Update cart display
function updateCart() {
  // Update count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  // Update cart items
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <p>🛒 Your cart is empty</p>
        <p style="font-size: 0.9rem;">Add some items to get started!</p>
      </div>
    `;
    cartFooter.style.display = 'none';
  } else {
    cartItems.innerHTML = cart
      .map(item => {
        // Check if image is a URL (starts with http:// or https://)
        const isImageUrl = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'));

        return `
          <div class="cart-item">
            <div class="cart-item-image">
              ${isImageUrl
                ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='📦'" />`
                : `<div class="cart-placeholder">${item.image || '📦'}</div>`
              }
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-actions">
              <button class="quantity-btn" onclick="window.updateQuantity(${item.id}, -1)">−</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn" onclick="window.updateQuantity(${item.id}, 1)">+</button>
              <button class="remove-btn" onclick="window.removeFromCart(${item.id})">🗑️</button>
            </div>
          </div>
        `;
      })
      .join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    cartFooter.style.display = 'block';
  }
}

// Update quantity
window.updateQuantity = function(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
    updateCart();
  }
};

// Remove from cart
window.removeFromCart = function(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
};

// Open/close cart
cartButton.addEventListener('click', () => {
  cartModal.classList.add('active');
});

closeCart.addEventListener('click', () => {
  cartModal.classList.remove('active');
});

cartModal.addEventListener('click', (e) => {
  if (e.target === cartModal) {
    cartModal.classList.remove('active');
  }
});

// Checkout
checkoutBtn.addEventListener('click', async () => {
  const email = customerEmail.value.trim();

  if (!email) {
    alert('Please enter your email address');
    customerEmail.focus();
    return;
  }

  if (!email.includes('@')) {
    alert('Please enter a valid email address');
    customerEmail.focus();
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Processing...';

  try {
    // For development: simulate checkout
    console.log('Checkout data:', { items: cart, customerEmail: email });

    // In production, this would call your backend:
    // const response = await fetch(`${API_URL}/create-checkout-session`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ items: cart, customerEmail: email })
    // });
    // const data = await response.json();
    // window.location.href = data.url;

    // For now, show success message
    alert('Demo Mode: In production, you would be redirected to Stripe checkout.\n\nOrder details:\n' +
          cart.map(item => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n') +
          `\n\nTotal: $${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`);

    // Clear cart
    cart = [];
    updateCart();
    cartModal.classList.remove('active');
    customerEmail.value = '';

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Sorry, there was an error processing your order. Please try again or contact support.');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Fetch products from API
  await fetchProducts();
  // Update cart display
  updateCart();
});
