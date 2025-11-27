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
});

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
      displayKPIs(data.stats);
      displayOrdersByStatus(data.stats.ordersByStatus);
      displayMonthlyRevenue(data.stats.monthlyRevenue);
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
 * Display KPI cards
 */
function displayKPIs(stats) {
  const { formatters } = window.adminAPI;

  document.getElementById('total-revenue').textContent = formatters.currency(stats.totalRevenue);
  document.getElementById('total-orders').textContent = stats.totalOrders.toLocaleString();
  document.getElementById('pending-orders').textContent = (stats.ordersByStatus.pending || 0).toLocaleString();
  document.getElementById('avg-order-value').textContent = formatters.currency(stats.averageOrderValue);
}

/**
 * Display orders by status
 */
function displayOrdersByStatus(ordersByStatus) {
  const container = document.getElementById('orders-by-status');

  if (!ordersByStatus || Object.keys(ordersByStatus).length === 0) {
    container.innerHTML = '<p class="no-data">No orders yet</p>';
    return;
  }

  const statusOrder = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'refunded', 'failed'];
  const { formatters } = window.adminAPI;

  let html = '<ul class="status-stats">';

  statusOrder.forEach(status => {
    const count = ordersByStatus[status] || 0;
    if (count > 0) {
      html += `
        <li class="status-stat-item">
          <span class="status-badge ${formatters.statusClass(status)}">
            ${formatters.statusText(status)}
          </span>
          <span class="status-count">${count}</span>
        </li>
      `;
    }
  });

  html += '</ul>';
  container.innerHTML = html;
}

/**
 * Display monthly revenue chart (simple bar chart)
 */
function displayMonthlyRevenue(monthlyRevenue) {
  const container = document.getElementById('monthly-revenue');

  if (!monthlyRevenue || Object.keys(monthlyRevenue).length === 0) {
    container.innerHTML = '<p class="no-data">No revenue data yet</p>';
    return;
  }

  const { formatters } = window.adminAPI;

  // Get months in order
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxRevenue = Math.max(...Object.values(monthlyRevenue));

  let html = '<div class="revenue-bars">';

  months.forEach(month => {
    const revenue = monthlyRevenue[month] || 0;
    if (revenue > 0) {
      const percentage = (revenue / maxRevenue) * 100;
      html += `
        <div class="revenue-bar-item">
          <div class="revenue-bar-container">
            <div class="revenue-bar" style="height: ${percentage}%"></div>
          </div>
          <div class="revenue-bar-label">${month}</div>
          <div class="revenue-bar-value">${formatters.currency(revenue)}</div>
        </div>
      `;
    }
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Display recent orders table
 */
function displayRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-table');
  const { formatters } = window.adminAPI;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">No orders yet</td></tr>';
    return;
  }

  let html = '';

  orders.slice(0, 10).forEach(order => {
    // Parse created_at if it's a string
    const createdAt = typeof order.created_at === 'string'
      ? order.created_at.replace(' ', 'T')
      : order.created_at;

    html += `
      <tr>
        <td>#${order.id}</td>
        <td>${order.customer_name || 'N/A'}</td>
        <td>${formatters.date(createdAt)}</td>
        <td>${formatters.currency(order.total_amount)}</td>
        <td>
          <span class="status-badge ${formatters.statusClass(order.status)}">
            ${formatters.statusText(order.status)}
          </span>
        </td>
        <td>
          <a href="orders.html?id=${order.id}" class="btn-link">View</a>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
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
