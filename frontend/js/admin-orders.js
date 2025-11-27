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
  initSelectAll();
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
    tbody.innerHTML = '<tr><td colspan="7" class="no-data" style="text-align: center; padding: 40px;">No orders found</td></tr>';
    return;
  }

  let html = '';

  orders.forEach(order => {
    // Parse created_at if it's a string
    const createdAt = typeof order.created_at === 'string'
      ? order.created_at.replace(' ', 'T')
      : order.created_at;

    // Format date for display
    const dateObj = new Date(createdAt);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateDisplay = monthNames[dateObj.getMonth()] + " " + dateObj.getDate();

    html += `
      <tr class="order-row" onclick="showOrderDetails(${order.id})" data-order-id="${order.id}">
        <td><input type="checkbox" onclick="event.stopPropagation()"></td>
        <td style="font-weight: 600;">#${order.id}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
              ${(order.customer_name || 'N/A').charAt(0).toUpperCase()}
            </div>
            ${order.customer_name || 'N/A'}
          </div>
        </td>
        <td>
          <span class="status-badge ${formatters.statusClass(order.status)}">
            ${formatters.statusText(order.status)}
          </span>
        </td>
        <td style="font-weight: 600;">${formatters.currency(order.total_amount)}</td>
        <td style="color: var(--gray);">${dateDisplay}</td>
        <td style="text-align: center; color: var(--gray); cursor: pointer;">•••</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Show order details in the right panel
 */
async function showOrderDetails(orderId) {
  console.log('Showing details for order:', orderId);

  if (!window.adminAPI) {
    console.error('adminAPI not available');
    return;
  }

  const panel = document.getElementById('order-details-panel');
  if (!panel) {
    console.error('order-details-panel not found');
    return;
  }

  try {
    // Fetch full order details
    const response = await window.adminAPI.orders.getById(orderId);

    if (!response.success) {
      throw new Error(response.message || 'Failed to load order details');
    }

    const order = response.order;
    const { formatters } = window.adminAPI;

    // Parse items if needed
    let items = order.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }

    // Build order items HTML
    let itemsHtml = '';
    if (items && items.length > 0) {
      itemsHtml = items.map(item => `
        <div class="order-item">
          <img src="${item.image || item.image_url || '../images/placeholder-product.png'}" alt="${item.name}" onerror="this.src='../images/placeholder-product.png'">
          <div class="order-item-info">
            <p class="item-name">${item.name}</p>
            <p class="item-quantity">Qty: ${item.quantity}</p>
            <p class="item-price">${formatters.currency(item.price)}</p>
          </div>
        </div>
      `).join('');
    } else {
      itemsHtml = '<p style="color: var(--gray); font-style: italic;">No items found</p>';
    }

    // Calculate subtotal (approximate if not provided)
    const subtotal = items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    const shipping = order.shipping_amount || 0;
    const tax = order.tax_amount || 0;

    // Build the panel HTML
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Order #${order.id}</h2>
        <button onclick="closePanel()" class="panel-close-btn" aria-label="Close">×</button>
      </div>

      <div class="panel-body">
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <span class="status-badge ${formatters.statusClass(order.status)}">${formatters.statusText(order.status)}</span>
          <button class="btn-small btn-secondary" onclick="toggleStatusUpdate(${order.id})">Update Status</button>
        </div>

        <div id="status-update-container-${order.id}" style="display: none; margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">New Status:</label>
          <select id="new-status-select-${order.id}" class="filter-select" style="width: 100%; margin-bottom: 10px;">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Canceled</option>
            <option value="refunded" ${order.status === 'refunded' ? 'selected' : ''}>Refunded</option>
          </select>
          <button class="btn-primary" style="width: 100%;" onclick="updateOrderStatus(${order.id})">Save Status</button>
        </div>

        <div class="customer-profile">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px; margin: 0 auto 12px;">
            ${(order.customer_name || 'N/A').charAt(0).toUpperCase()}
          </div>
          <h3>${order.customer_name || 'N/A'}</h3>
          <p class="customer-email">${order.customer_email || 'N/A'}</p>
          <div class="contact-icons">
            <button title="Email" onclick="window.location.href='mailto:${order.customer_email}'">✉️</button>
            <button title="Phone" ${order.customer_phone ? `onclick="window.location.href='tel:${order.customer_phone}'"` : 'disabled'}>📞</button>
            <button title="Message">💬</button>
          </div>
        </div>

        <div class="order-items-section" style="flex: 1; overflow-y: auto; margin-bottom: 20px;">
          <h4>Order Items</h4>
          ${itemsHtml}
        </div>

        <div class="order-details-summary">
          <div class="order-detail-row">
            <span class="label">Subtotal</span>
            <span class="value">${formatters.currency(subtotal)}</span>
          </div>
          <div class="order-detail-row">
            <span class="label">Shipping</span>
            <span class="value">${formatters.currency(shipping)}</span>
          </div>
          <div class="order-detail-row">
            <span class="label">Tax</span>
            <span class="value">${formatters.currency(tax)}</span>
          </div>
          <div class="order-detail-row total">
            <span class="label">Total</span>
            <span class="value">${formatters.currency(order.total_amount)}</span>
          </div>
        </div>

        <div class="details-actions">
          <button class="btn-track" onclick="trackOrder(${order.id})">Track Order</button>
          <button class="btn-refund" onclick="refundOrder(${order.id})">Refund</button>
        </div>
      </div>
    `;

    // Show the panel
    panel.style.display = 'flex';

    // Highlight the selected row
    document.querySelectorAll('.order-row').forEach(row => row.classList.remove('selected'));
    const selectedRow = document.querySelector(`.order-row[data-order-id="${orderId}"]`);
    if (selectedRow) {
      selectedRow.classList.add('selected');
    }

  } catch (error) {
    console.error('Error loading order details:', error);
    window.adminAPI.ui.showToast('Failed to load order details: ' + error.message, 'error');
  }
}

/**
 * Close the order details panel
 */
function closePanel() {
  const panel = document.getElementById('order-details-panel');
  if (panel) {
    panel.style.display = 'none';
  }

  // Remove selection from all rows
  document.querySelectorAll('.order-row').forEach(row => row.classList.remove('selected'));
}

/**
 * Toggle status update form
 */
function toggleStatusUpdate(orderId) {
  const container = document.getElementById(`status-update-container-${orderId}`);
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId) {
  const select = document.getElementById(`new-status-select-${orderId}`);
  if (!select) return;

  const newStatus = select.value;

  try {
    const data = await window.adminAPI.orders.updateStatus(orderId, newStatus);

    if (data.success) {
      window.adminAPI.ui.showToast('Order status updated successfully');
      // Refresh the list and the details
      await loadOrders();
      await showOrderDetails(orderId);
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

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      loadOrders();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      const [sort, order] = e.target.value.split('-');
      currentFilters.sort = sort;
      currentFilters.order = order;
      loadOrders();
    });
  }
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
 * Initialize select all checkbox
 */
function initSelectAll() {
  const selectAllCheckbox = document.getElementById('select-all-orders');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('#orders-table-body input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
    });
  }
}

/**
 * Track order (placeholder function)
 */
function trackOrder(orderId) {
  console.log('Track order:', orderId);
  window.adminAPI.ui.showToast('Tracking feature coming soon!', 'info');
}

/**
 * Refund order (placeholder function)
 */
function refundOrder(orderId) {
  console.log('Refund order:', orderId);
  if (confirm('Are you sure you want to refund this order?')) {
    window.adminAPI.ui.showToast('Refund feature coming soon!', 'info');
  }
}

// Make functions available globally
window.showOrderDetails = showOrderDetails;
window.closePanel = closePanel;
window.toggleStatusUpdate = toggleStatusUpdate;
window.updateOrderStatus = updateOrderStatus;
window.trackOrder = trackOrder;
window.refundOrder = refundOrder;
