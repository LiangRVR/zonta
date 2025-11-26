/**
 * Admin API Client
 * Handles all admin API calls with authentication
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Make authenticated API request
 */
async function makeAuthRequest(endpoint, options = {}) {
  const token = await window.adminAuth.getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Orders API
 */
const ordersAPI = {
  /**
   * Get all orders with optional filters
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`;
    return makeAuthRequest(endpoint);
  },

  /**
   * Get single order by ID
   */
  async getById(orderId) {
    return makeAuthRequest(`/admin/orders/${orderId}`);
  },

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    return makeAuthRequest(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

/**
 * Products API
 */
const productsAPI = {
  /**
   * Get all products (including inactive)
   */
  async getAll() {
    return makeAuthRequest('/admin/products');
  },

  /**
   * Create new product
   */
  async create(productData) {
    return makeAuthRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  /**
   * Update existing product
   */
  async update(productId, productData) {
    return makeAuthRequest(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  /**
   * Delete product (soft delete by default)
   */
  async delete(productId, permanent = false) {
    const endpoint = `/admin/products/${productId}${permanent ? '?permanent=true' : ''}`;
    return makeAuthRequest(endpoint, {
      method: 'DELETE',
    });
  },
};

/**
 * Statistics API
 */
const statsAPI = {
  /**
   * Get dashboard statistics
   */
  async getDashboard() {
    return makeAuthRequest('/admin/stats');
  },
};

/**
 * Helper functions for formatting
 */
const formatters = {
  /**
   * Format currency
   */
  currency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  /**
   * Format date
   */
  date(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format datetime
   */
  datetime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Get status badge class
   */
  statusClass(status) {
    const statusClasses = {
      pending: 'status-pending',
      paid: 'status-paid',
      preparing: 'status-preparing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      canceled: 'status-canceled',
      refunded: 'status-refunded',
      failed: 'status-failed',
    };
    return statusClasses[status] || 'status-default';
  },

  /**
   * Format status text
   */
  statusText(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  },
};

/**
 * UI Helper functions
 */
const uiHelpers = {
  /**
   * Show loading state
   */
  showLoading(loadingId = 'loading-state') {
    const loading = document.getElementById(loadingId);
    if (loading) loading.style.display = 'block';
  },

  /**
   * Hide loading state
   */
  hideLoading(loadingId = 'loading-state') {
    const loading = document.getElementById(loadingId);
    if (loading) loading.style.display = 'none';
  },

  /**
   * Show error state
   */
  showError(message = 'An error occurred', errorId = 'error-state') {
    const error = document.getElementById(errorId);
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  },

  /**
   * Hide error state
   */
  hideError(errorId = 'error-state') {
    const error = document.getElementById(errorId);
    if (error) error.style.display = 'none';
  },

  /**
   * Show content
   */
  showContent(contentId) {
    const content = document.getElementById(contentId);
    if (content) content.style.display = 'block';
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Confirm action
   */
  async confirm(message) {
    return window.confirm(message);
  },
};

// Export for use in other modules
window.adminAPI = {
  orders: ordersAPI,
  products: productsAPI,
  stats: statsAPI,
  formatters,
  ui: uiHelpers,
};
