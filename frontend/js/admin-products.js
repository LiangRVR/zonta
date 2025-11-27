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
  initModal();
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
    tbody.innerHTML = '<tr><td colspan="9" class="no-data">No products found</td></tr>';
    return;
  }

  let html = '';

  filteredProducts.forEach(product => {
    const truncatedDesc = product.description
      ? (product.description.length > 50 ? product.description.substring(0, 50) + '...' : product.description)
      : 'N/A';

    const imageUrl = product.image || product.image_url || '';
    const imageHtml = imageUrl
      ? `<img src="${imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.outerHTML='<span style=\"font-size: 32px;\">📦</span>'" />`
      : '<span style="font-size: 32px;">📦</span>';

    html += `
      <tr>
        <td>${product.id}</td>
        <td>${imageHtml}</td>
        <td><strong>${product.name}</strong></td>
        <td>${truncatedDesc}</td>
        <td>${formatters.currency(product.price)}</td>
        <td>${product.category || 'N/A'}</td>
        <td>${product.stock || 0}</td>
        <td>
          <span class="status-badge ${product.active ? 'status-active' : 'status-inactive'}">
            ${product.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn-small btn-primary" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn-small ${product.active ? 'btn-warning' : 'btn-success'}" onclick="toggleProductStatus(${product.id}, ${product.active})">
            ${product.active ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn-small btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Show add product form
 */
function showAddProductForm() {
  editingProduct = null;

  document.getElementById('modal-title').textContent = 'Add Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';

  const modal = document.getElementById('product-modal');
  modal.style.display = 'flex';
}

/**
 * Edit product
 */
async function editProduct(productId) {
  const product = currentProducts.find(p => p.id === productId);

  if (!product) {
    window.adminAPI.ui.showToast('Product not found', 'error');
    return;
  }

  editingProduct = product;

  // Populate form
  document.getElementById('modal-title').textContent = 'Edit Product';
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

  const modal = document.getElementById('product-modal');
  modal.style.display = 'flex';
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

    if (editingProduct) {
      // Update existing product
      data = await window.adminAPI.products.update(editingProduct.id, productData);
    } else {
      // Create new product
      data = await window.adminAPI.products.create(productData);
    }

    if (data.success) {
      window.adminAPI.ui.showToast(`Product ${editingProduct ? 'updated' : 'created'} successfully`);
      closeModal();
      await loadProducts();
    }
  } catch (error) {
    console.error('Error saving product:', error);
    window.adminAPI.ui.showToast('Failed to save product: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
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
    addBtn.addEventListener('click', showAddProductForm);
  }
}

/**
 * Initialize modal
 */
function initModal() {
  const modal = document.getElementById('product-modal');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-btn');
  const form = document.getElementById('product-form');

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  form.addEventListener('submit', saveProduct);

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
  const modal = document.getElementById('product-modal');
  modal.style.display = 'none';
  editingProduct = null;
}

// Make functions available globally
window.editProduct = editProduct;
window.toggleProductStatus = toggleProductStatus;
window.deleteProduct = deleteProduct;
window.closeModal = closeModal;
