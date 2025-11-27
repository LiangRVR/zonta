/**
 * Admin Products Management JavaScript
 * Handles product listing, creation, editing, and deletion
 */

let currentProducts = [];
let editingProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  initFilters();
  initRefreshButton();
  initPanel();
  initAddButton();
});

/**
 * Load products from API
 */
async function loadProducts() {
  const { ui } = window.adminAPI;

  try {
    ui.showLoading();
    ui.hideError();

    const data = await window.adminAPI.products.getAll();

    if (data.success) {
      currentProducts = data.products;
      displayProducts(currentProducts);

      ui.hideLoading();
      ui.showContent('products-content');
    } else {
      throw new Error('Failed to load products');
    }
  } catch (error) {
    console.error('Error loading products:', error);
    ui.hideLoading();
    ui.showError('Failed to load products: ' + error.message);
  }
}

/**
 * Display products in table
 */
function displayProducts(products) {
  const tbody = document.getElementById('products-table-body');
  const activeFilter = document.getElementById('active-filter').value;
  const { formatters } = window.adminAPI;

  // Filter products based on active filter
  let filteredProducts = products;
  if (activeFilter === 'active') {
    filteredProducts = products.filter(p => p.active);
  } else if (activeFilter === 'inactive') {
    filteredProducts = products.filter(p => !p.active);
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">No products found</td></tr>';
    return;
  }

  let html = '';

  filteredProducts.forEach(product => {
    const imageUrl = product.image || product.image_url || '';
    const imageHtml = imageUrl
      ? `<img src="${imageUrl}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.outerHTML='<span style=&quot;font-size: 24px;&quot;>📦</span>'" />`
      : '<span style="font-size: 24px;">📦</span>';

    html += `
      <tr class="product-row" data-id="${product.id}" onclick="showProductDetails(${product.id})">
        <td>${product.id}</td>
        <td>${imageHtml}</td>
        <td><strong>${product.name}</strong></td>
        <td>${formatters.currency(product.price)}</td>
        <td>${product.category || 'N/A'}</td>
        <td>${product.stock || 0}</td>
        <td>
          <span class="status-badge ${product.active ? 'status-active' : 'status-inactive'}">
            ${product.active ? 'Active' : 'Inactive'}
          </span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Show add product panel
 */
function showAddProductPanel() {
  editingProduct = null;

  // Clear selection
  document.querySelectorAll('.product-row').forEach(row => row.classList.remove('selected'));

  document.getElementById('panel-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('save-btn').textContent = 'Create Product';

  // Hide edit actions (delete/deactivate)
  document.getElementById('edit-actions').style.display = 'none';

  const panel = document.getElementById('product-details-panel');
  panel.style.display = 'flex';
}

/**
 * Show product details in panel
 */
function showProductDetails(productId) {
  const product = currentProducts.find(p => p.id === productId);

  if (!product) return;

  editingProduct = product;

  // Highlight row
  document.querySelectorAll('.product-row').forEach(row => row.classList.remove('selected'));
  const row = document.querySelector(`.product-row[data-id="${productId}"]`);
  if (row) row.classList.add('selected');

  // Populate form
  document.getElementById('panel-title').textContent = 'Edit Product';
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description || '';
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock || 0;
  document.getElementById('product-category').value = product.category || '';
  document.getElementById('product-image').value = product.image || '';
  document.getElementById('product-image-url').value = product.image_url || '';
  document.getElementById('product-display-order').value = product.display_order || 0;
  document.getElementById('product-active').checked = product.active !== false;

  document.getElementById('save-btn').textContent = 'Save Changes';

  // Show edit actions
  const editActions = document.getElementById('edit-actions');
  editActions.style.display = 'flex';
  editActions.innerHTML = `
    <button type="button" class="btn-warning" style="flex: 1;" onclick="toggleProductStatus(${product.id}, ${product.active})">
      ${product.active ? 'Deactivate' : 'Activate'}
    </button>
    <button type="button" class="btn-danger" style="flex: 1;" onclick="deleteProduct(${product.id})">
      Delete
    </button>
  `;

  const panel = document.getElementById('product-details-panel');
  panel.style.display = 'flex';
}

/**
 * Toggle product active status
 */
async function toggleProductStatus(productId, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  const confirmed = await window.adminAPI.ui.confirm(`Are you sure you want to ${action} this product?`);

  if (!confirmed) return;

  try {
    const data = await window.adminAPI.products.update(productId, { active: !currentStatus });

    if (data.success) {
      window.adminAPI.ui.showToast(`Product ${action}d successfully`);
      await loadProducts();
      // Re-open details to show updated status
      showProductDetails(productId);
    }
  } catch (error) {
    console.error('Error toggling product status:', error);
    window.adminAPI.ui.showToast('Failed to update product status', 'error');
  }
}

/**
 * Delete product
 */
async function deleteProduct(productId) {
  const confirmed = await window.adminAPI.ui.confirm(
    'Are you sure you want to delete this product? This will deactivate it (soft delete).\n\nClick OK to deactivate, or Cancel to abort.'
  );

  if (!confirmed) return;

  try {
    const data = await window.adminAPI.products.delete(productId, false);

    if (data.success) {
      window.adminAPI.ui.showToast('Product deactivated successfully');
      closePanel();
      await loadProducts();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    window.adminAPI.ui.showToast('Failed to delete product', 'error');
  }
}

/**
 * Save product (create or update)
 */
async function saveProduct(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const productData = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: parseFloat(formData.get('price')),
    category: formData.get('category'),
    image: formData.get('image'),
    image_url: formData.get('image_url'),
    stock: parseInt(formData.get('stock')),
    display_order: parseInt(formData.get('display_order')),
    active: formData.get('active') === 'on',
  };

  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    let data;
    let savedId;

    if (editingProduct) {
      // Update existing product
      data = await window.adminAPI.products.update(editingProduct.id, productData);
      savedId = editingProduct.id;
    } else {
      // Create new product
      data = await window.adminAPI.products.create(productData);
      savedId = data.product ? data.product.id : null;
    }

    if (data.success) {
      window.adminAPI.ui.showToast(`Product ${editingProduct ? 'updated' : 'created'} successfully`);
      await loadProducts();

      // If we created a new product, try to find it and select it
      if (!editingProduct && savedId) {
         // Reloading products might take a moment, so we might need to find it in the new list
         // For now, just closing the panel or keeping it open for the new product is fine.
         // Let's just close it for new products to show the list
         closePanel();
      } else if (editingProduct) {
         // If editing, keep the panel open and refresh details
         showProductDetails(savedId);
      }
    }
  } catch (error) {
    console.error('Error saving product:', error);
    window.adminAPI.ui.showToast('Failed to save product: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = editingProduct ? 'Save Changes' : 'Create Product';
  }
}

/**
 * Initialize filters
 */
function initFilters() {
  const activeFilter = document.getElementById('active-filter');

  activeFilter.addEventListener('change', () => {
    displayProducts(currentProducts);
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

      await loadProducts();

      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh';

      window.adminAPI.ui.showToast('Products refreshed');
    });
  }
}

/**
 * Initialize add button
 */
function initAddButton() {
  const addBtn = document.getElementById('add-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', showAddProductPanel);
  }
}

/**
 * Initialize panel
 */
function initPanel() {
  const closeBtn = document.getElementById('close-panel-btn');
  const form = document.getElementById('product-form');

  closeBtn.addEventListener('click', closePanel);
  form.addEventListener('submit', saveProduct);
}

/**
 * Close panel
 */
function closePanel() {
  const panel = document.getElementById('product-details-panel');
  panel.style.display = 'none';
  editingProduct = null;
  document.querySelectorAll('.product-row').forEach(row => row.classList.remove('selected'));
}

// Make functions available globally
window.showProductDetails = showProductDetails;
window.toggleProductStatus = toggleProductStatus;
window.deleteProduct = deleteProduct;
window.closePanel = closePanel;
