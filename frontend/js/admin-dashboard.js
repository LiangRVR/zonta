/**
 * Admin Dashboard JavaScript
 * Handles dashboard overview with KPIs, recent orders, and sales chart
 */

let salesChart = null;

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

    console.log('Fetching dashboard overview...');

    // Fetch overview data
    const data = await window.adminAPI.stats.getOverview();

    console.log('Dashboard overview received:', data);

    if (data.success) {
      // Populate KPI cards
      populateKPICards(data);

      // Render recent orders
      renderRecentOrders(data.recentOrders);

      // Initialize chart
      initSalesChart(data.salesLast7Days);

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
 * Populate KPI cards with data
 */
function populateKPICards(data) {
  const { formatters } = window.adminAPI;

  // Total Revenue
  const totalRevenueCard = document.querySelector('#kpi-total-revenue .kpi-value');
  if (totalRevenueCard) {
    totalRevenueCard.textContent = formatters.currency(data.totalRevenue || 0);
  }

  // Total Orders
  const totalOrdersCard = document.querySelector('#kpi-total-orders .kpi-value');
  if (totalOrdersCard) {
    totalOrdersCard.textContent = data.totalOrders || 0;
  }

  // Week Revenue
  const weekRevenueCard = document.querySelector('#kpi-week-revenue .kpi-value');
  if (weekRevenueCard) {
    weekRevenueCard.textContent = formatters.currency(data.weekRevenue || 0);
  }

  // Month Revenue
  const monthRevenueCard = document.querySelector('#kpi-month-revenue .kpi-value');
  if (monthRevenueCard) {
    monthRevenueCard.textContent = formatters.currency(data.monthRevenue || 0);
  }
}

/**
 * Render recent orders table
 */
function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-body');
  const { formatters } = window.adminAPI;

  if (!tbody) {
    console.error('recent-orders-body not found');
    return;
  }

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data" style="text-align: center; padding: 20px;">No orders yet</td></tr>';
    return;
  }

  let html = '';

  orders.forEach(order => {
    // Format date
    const dateObj = new Date(order.date);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateDisplay = monthNames[dateObj.getMonth()] + " " + dateObj.getDate();

    html += `
      <tr class="order-row" onclick="window.location.href='orders.html'">
        <td style="font-weight: 600;">#${order.id}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">
              ${(order.customer || 'N').charAt(0).toUpperCase()}
            </div>
            <span style="font-size: 13px;">${order.customer}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${formatters.statusClass(order.status)}">
            ${formatters.statusText(order.status)}
          </span>
        </td>
        <td style="font-weight: 600;">${formatters.currency(order.total)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Initialize sales chart with Chart.js
 */
function initSalesChart(salesData) {
  const ctx = document.getElementById('salesChart');

  if (!ctx) {
    console.error('salesChart canvas not found');
    return;
  }

  // Destroy existing chart if any
  if (salesChart) {
    salesChart.destroy();
  }

  // Prepare data
  const labels = salesData.map(d => {
    const date = new Date(d.date);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[date.getMonth()] + " " + date.getDate();
  });

  const revenues = salesData.map(d => d.revenue);

  // Color palette from CSS variables
  const primaryColor = '#8B3A3C'; // Maroon

  // Create gradient
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, 'rgba(139, 58, 60, 0.3)');
  gradient.addColorStop(1, 'rgba(139, 58, 60, 0.0)');

  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: revenues,
        borderColor: primaryColor,
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(44, 62, 80, 0.9)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ' $' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#666'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#666',
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
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

      await loadDashboard();

      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh';

      window.adminAPI.ui.showToast('Dashboard refreshed');
    });
  }
}
