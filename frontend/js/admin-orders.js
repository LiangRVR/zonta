/**
 * Admin Orders Management JavaScript
 * Handles order listing, filtering, and status updates
 */

let currentOrders = [];
let currentFilters = {
  status: '',
  sort: 'created_at',
  order: 'desc',
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadOrders();
  initFilters();
  initRefreshButton();
  initModal();
});

/**
 * Load orders from API
 */
async function loadOrders() {
  const { ui } = window.adminAPI;

  try {
    ui.showLoading();
    ui.hideError();

    const params = {};
    if (currentFilters.status) params.status = currentFilters.status;
    params.sort = currentFilters.sort;
    params.order = currentFilters.order;

    const data = await window.adminAPI.orders.getAll(params);

    if (data.success) {
      currentOrders = data.orders;
      displayOrders(currentOrders);

      ui.hideLoading();
      ui.showContent('orders-content');
    } else {
      throw new Error('Failed to load orders');
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    ui.hideLoading();
    ui.showError('Failed to load orders: ' + error.message);
  }
}

/**
 * Display orders in table
 */
function displayOrders(orders) {
  const tbody = document.getElementById('orders-table-body');
  const { formatters } = window.adminAPI;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">No orders found</td></tr>';
    return;
  }

  let html = '';

  orders.forEach(order => {
    html += `
      <tr>
        <td>#${order.id}</td>
        <td>${order.customer_name || 'N/A'}</td>
        <td>${order.customer_email}</td>
        <td>${formatters.datetime(order.created_at)}</td>
        <td>${formatters.currency(order.total_amount)}</td>
        <td>
          <span class="status-badge ${formatters.statusClass(order.status)}">
            ${formatters.statusText(order.status)}
          </span>
        </td>
        <td>
          <button class="btn-small btn-primary" onclick="viewOrder(${order.id})">View</button>
          <button class="btn-small btn-secondary" onclick="showStatusUpdate(${order.id}, '${order.status}')">
            Update Status
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * View order details
 */
async function viewOrder(orderId) {
  try {
    const data = await window.adminAPI.orders.getById(orderId);

    if (data.success) {
      showOrderModal(data.order);
    }
  } catch (error) {
    console.error('Error loading order:', error);
    window.adminAPI.ui.showToast('Failed to load order details', 'error');
  }
}

/**
 * Show order details in modal
 */
function showOrderModal(order) {
  const modal = document.getElementById('order-modal');
  const detailsContainer = document.getElementById('order-details');
  const { formatters } = window.adminAPI;

  let html = `
    <div class="order-detail-grid">
      <div class="detail-section">
        <h3>Order Information</h3>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Status:</strong>
          <span class="status-badge ${formatters.statusClass(order.status)}">
            ${formatters.statusText(order.status)}
          </span>
        </p>
        <p><strong>Created:</strong> ${formatters.datetime(order.created_at)}</p>
        ${order.paid_at ? `<p><strong>Paid:</strong> ${formatters.datetime(order.paid_at)}</p>` : ''}
        <p><strong>Total Amount:</strong> ${formatters.currency(order.total_amount)}</p>
      </div>

      <div class="detail-section">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${order.customer_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${order.customer_email}</p>
      </div>
  `;

  if (order.shipping_address) {
    const addr = order.shipping_address.address || {};
    html += `
      <div class="detail-section">
        <h3>Shipping Address</h3>
        <p><strong>Name:</strong> ${order.shipping_address.name || 'N/A'}</p>
        <p>${addr.line1 || ''}</p>
        ${addr.line2 ? `<p>${addr.line2}</p>` : ''}
        <p>${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}</p>
        <p>${addr.country || ''}</p>
      </div>
    `;
  }

  html += `
      <div class="detail-section full-width">
        <h3>Order Items</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      html += `
        <tr>
          <td>${item.name || 'Unknown'}</td>
          <td>${item.quantity || 1}</td>
          <td>${formatters.currency(item.price || 0)}</td>
          <td>${formatters.currency((item.price || 0) * (item.quantity || 1))}</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  detailsContainer.innerHTML = html;
  modal.style.display = 'flex';
}

/**
 * Show status update dialog
 */
function showStatusUpdate(orderId, currentStatus) {
  const statuses = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'refunded', 'failed'];

  let options = '<select id="new-status-select" class="filter-select">';
  statuses.forEach(status => {
    const selected = status === currentStatus ? 'selected' : '';
    options += `<option value="${status}" ${selected}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`;
  });
  options += '</select>';

  const detailsContainer = document.getElementById('order-details');
  detailsContainer.innerHTML = `
    <div class="status-update-form">
      <h3>Update Order Status</h3>
      <p><strong>Order ID:</strong> #${orderId}</p>
      <p><strong>Current Status:</strong> ${currentStatus}</p>
      <div class="form-group">
        <label>New Status:</label>
        ${options}
      </div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" onclick="updateOrderStatus(${orderId})">Update Status</button>
      </div>
    </div>
  `;

  const modal = document.getElementById('order-modal');
  modal.style.display = 'flex';
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId) {
  const newStatus = document.getElementById('new-status-select').value;

  try {
    const data = await window.adminAPI.orders.updateStatus(orderId, newStatus);

    if (data.success) {
      window.adminAPI.ui.showToast('Order status updated successfully');
      closeModal();
      await loadOrders();
    }
  } catch (error) {
    console.error('Error updating status:', error);
    window.adminAPI.ui.showToast('Failed to update order status', 'error');
  }
}

/**
 * Initialize filters
 */
function initFilters() {
  const statusFilter = document.getElementById('status-filter');
  const sortFilter = document.getElementById('sort-filter');

  statusFilter.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadOrders();
  });

  sortFilter.addEventListener('change', (e) => {
    const [sort, order] = e.target.value.split('-');
    currentFilters.sort = sort;
    currentFilters.order = order;
    loadOrders();
  });
}

/**
 * Initialize refresh button
 */
function initRefreshButton() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Refreshing...';

      await loadOrders();

      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh';

      window.adminAPI.ui.showToast('Orders refreshed');
    });
  }
}

/**
 * Initialize modal
 */
function initModal() {
  const modal = document.getElementById('order-modal');
  const closeBtn = document.getElementById('close-modal');

  closeBtn.addEventListener('click', closeModal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.getElementById('order-modal');
  modal.style.display = 'none';
}

// Make functions available globally
window.viewOrder = viewOrder;
window.showStatusUpdate = showStatusUpdate;
window.updateOrderStatus = updateOrderStatus;
window.closeModal = closeModal;
