/**
 * Admin Dashboard JavaScript
 * Handles dashboard statistics and KPI display
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure admin modules are loaded
  if (!window.adminAPI || !window.adminAuth) {
    console.error('Admin modules not loaded');
    document.getElementById('error-state').textContent = 'Failed to load admin modules';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('loading-state').style.display = 'none';
    return;
  }

  // Check authentication
  const user = await window.adminAuth.getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Display user email
  const userEmailEl = document.getElementById('user-email');
  if (userEmailEl) {
    userEmailEl.textContent = user.email;
  }

  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.adminAuth.signOut();
      window.location.href = 'login.html';
    });
  }

  await loadDashboard();
  initRefreshButton();
  initFilters();
  initSelectAll();
});

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
 * Initialize filter functionality
 */
function initFilters() {
  const statusFilter = document.getElementById('filter-status');
  const sortFilter = document.getElementById('filter-sort');

  if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', applyFilters);
  }
}

/**
 * Apply filters and sorting to orders
 */
async function applyFilters() {
  console.log('Applying filters...');
  const { ui } = window.adminAPI;

  try {
    ui.showLoading();
    const data = await window.adminAPI.stats.getDashboard();

    if (data.success) {
      let orders = data.stats.recentOrders || [];

      // Apply status filter
      const statusFilter = document.getElementById('filter-status');
      if (statusFilter && statusFilter.value) {
        orders = orders.filter(order => order.status === statusFilter.value);
      }

      // Apply sorting
      const sortFilter = document.getElementById('filter-sort');
      if (sortFilter) {
        switch (sortFilter.value) {
          case 'date-desc':
            orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
          case 'date-asc':
            orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
          case 'amount-desc':
            orders.sort((a, b) => b.total_amount - a.total_amount);
            break;
          case 'amount-asc':
            orders.sort((a, b) => a.total_amount - b.total_amount);
            break;
        }
      }

      displayRecentOrders(orders);
      ui.hideLoading();
    }
  } catch (error) {
    console.error('Error applying filters:', error);
    ui.hideLoading();
  }
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
  if (!window.adminAPI) {
    console.error('adminAPI not available');
    return;
  }

  const { ui } = window.adminAPI;

  try {
    ui.showLoading();
    ui.hideError();

    console.log('Fetching dashboard stats...');

    // Fetch statistics
    const data = await window.adminAPI.stats.getDashboard();

    console.log('Dashboard data received:', data);

    if (data.success) {
      displayRecentOrders(data.stats.recentOrders);

      ui.hideLoading();
      ui.showContent('dashboard-content');
    } else {
      throw new Error('Failed to load dashboard data');
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    ui.hideLoading();
    const errorMessage = error.message || 'Unknown error occurred';
    ui.showError('Failed to load dashboard data: ' + errorMessage);
    document.getElementById('error-state').style.display = 'block';
  }
}

/**
 * Display recent orders table
 */
function displayRecentOrders(orders) {
  const tbody = document.getElementById('orders-table-body');

  if (!tbody) {
    console.error('orders-table-body tbody not found');
    return;
  }

  const { formatters } = window.adminAPI;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data" style="text-align: center; padding: 40px;">No orders yet</td></tr>';
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

    // Parse created_at
    const createdAt = typeof order.created_at === 'string'
      ? order.created_at.replace(' ', 'T')
      : order.created_at;

    // Build order items HTML
    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
      itemsHtml = order.items.map(item => `
        <div class="order-item">
          <img src="${item.image_url || '../images/placeholder-product.png'}" alt="${item.name}" onerror="this.src='../images/placeholder-product.png'">
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

    // Calculate subtotal
    const subtotal = order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    const shipping = order.shipping_amount || 0;
    const tax = order.tax_amount || 0;

    // Build the panel HTML
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Order #${order.id}</h2>
        <button onclick="closePanel()" class="panel-close-btn" aria-label="Close">×</button>
      </div>

      <div class="panel-body">
        <div style="margin-bottom: 20px;">
          <span class="status-badge ${formatters.statusClass(order.status)}">${formatters.statusText(order.status)}</span>
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

/**
 * Initialize refresh button
 */
function initRefreshButton() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Refreshing...';

      await loadDashboard();

      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh';

      window.adminAPI.ui.showToast('Dashboard refreshed');
    });
  }
}
