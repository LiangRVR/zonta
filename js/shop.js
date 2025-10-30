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

// Mock products data (replace with API call when backend is ready)
products = [
  {
    id: 1,
    name: 'Zonta Tote Bag',
    description: 'Durable canvas tote bag with Zonta logo. Perfect for everyday use.',
    price: 25.00,
    image: '👜',
    active: true
  },
  {
    id: 2,
    name: 'Zonta T-Shirt',
    description: 'Comfortable cotton t-shirt featuring our mission statement.',
    price: 30.00,
    image: '👕',
    active: true
  },
  {
    id: 3,
    name: 'Zonta Mug',
    description: 'Ceramic coffee mug with inspiring Zonta quote.',
    price: 15.00,
    image: '☕',
    active: true
  },
  {
    id: 4,
    name: 'Zonta Pin',
    description: 'Gold-plated enamel pin with Zonta International logo.',
    price: 10.00,
    image: '📌',
    active: true
  },
  {
    id: 5,
    name: 'Zonta Notebook',
    description: 'Hardcover journal with Zonta branding. 200 pages.',
    price: 20.00,
    image: '📓',
    active: true
  },
  {
    id: 6,
    name: 'Zonta Cap',
    description: 'Adjustable baseball cap with embroidered logo.',
    price: 22.00,
    image: '🧢',
    active: true
  }
];

// Display products
function displayProducts() {
  productsLoading.style.display = 'none';
  productsGrid.style.display = 'grid';

  productsGrid.innerHTML = products
    .filter(p => p.active)
    .map(product => `
      <div class="product-card">
        <div class="product-image">
          ${product.image}
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="add-to-cart-btn" onclick="window.addToCart(${product.id}, event)">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `)
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
      .map(item => `
        <div class="cart-item">
          <div class="cart-item-image">${item.image}</div>
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
      `)
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
setTimeout(() => {
  displayProducts();
  updateCart();
}, 500);
