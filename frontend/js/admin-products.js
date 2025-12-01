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
  initImageUpload();
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
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">No products found</td></tr>';
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
        <td>${product.display_order || 0}</td>
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

  // Clear image preview
  clearImagePreview();

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
  document.getElementById('product-display-order').value = product.display_order || 0;
  document.getElementById('product-active').checked = product.active !== false;

  // Show existing image preview if product has an image
  const imageUrl = product.image || '';
  if (imageUrl) {
    showImagePreview(imageUrl);
  } else {
    clearImagePreview();
  }

  // Clear file input for new uploads
  const fileInput = document.getElementById('product-image-file');
  if (fileInput) fileInput.value = '';

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
 * Show image preview
 */
function showImagePreview(url) {
  const previewContainer = document.getElementById('image-preview');
  const removeBtn = document.getElementById('remove-image-btn');

  if (previewContainer) {
    // Replace placeholder content with actual image
    previewContainer.innerHTML = `<img src="${url}" alt="Product preview" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;">`;
  }

  if (removeBtn) {
    removeBtn.style.display = 'inline-block';
  }
}

/**
 * Clear image preview
 */
function clearImagePreview() {
  const previewContainer = document.getElementById('image-preview');
  const removeBtn = document.getElementById('remove-image-btn');
  const fileInput = document.getElementById('product-image-file');

  if (previewContainer) {
    // Restore placeholder content
    previewContainer.innerHTML = `
      <span class="placeholder-icon">📷</span>
      <span class="placeholder-text">No image selected</span>
    `;
  }

  if (removeBtn) {
    removeBtn.style.display = 'none';
  }

  if (fileInput) {
    fileInput.value = '';
  }
}

/**
 * Remove current image (for editing)
 */
function removeCurrentImage() {
  clearImagePreview();

  // Set a flag to indicate the image should be removed on save
  const form = document.getElementById('product-form');
  if (form) {
    // Add hidden field to indicate image removal
    let removeField = document.getElementById('remove-image-flag');
    if (!removeField) {
      removeField = document.createElement('input');
      removeField.type = 'hidden';
      removeField.id = 'remove-image-flag';
      removeField.name = 'remove_image';
      form.appendChild(removeField);
    }
    removeField.value = 'true';
  }

  window.adminAPI.ui.showToast('Image will be removed when you save', 'info');
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

  // Build FormData for file upload support
  const formDataObj = new FormData();

  // Get form values
  const nameInput = document.getElementById('product-name');
  const descInput = document.getElementById('product-description');
  const priceInput = document.getElementById('product-price');
  const displayOrderInput = document.getElementById('product-display-order');
  const activeInput = document.getElementById('product-active');
  const imageFileInput = document.getElementById('product-image-file');

  // Append text fields
  formDataObj.append('name', nameInput.value);
  formDataObj.append('description', descInput.value);
  formDataObj.append('price', priceInput.value);
  formDataObj.append('display_order', displayOrderInput.value);
  formDataObj.append('active', activeInput.checked ? 'true' : 'false');

  // Append image file if selected
  if (imageFileInput && imageFileInput.files.length > 0) {
    formDataObj.append('image', imageFileInput.files[0]);
  }

  // Check if image should be removed
  const removeImageFlag = document.getElementById('remove-image-flag');
  if (removeImageFlag && removeImageFlag.value === 'true') {
    formDataObj.append('remove_image', 'true');
  }

  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    let data;
    let savedId;

    if (editingProduct) {
      // Update existing product
      data = await window.adminAPI.products.updateWithFormData(editingProduct.id, formDataObj);
      savedId = editingProduct.id;
    } else {
      // Create new product
      data = await window.adminAPI.products.createWithFormData(formDataObj);
      savedId = data.product ? data.product.id : null;
    }

    if (data.success) {
      window.adminAPI.ui.showToast(`Product ${editingProduct ? 'updated' : 'created'} successfully`);

      // Clear the remove image flag
      if (removeImageFlag) removeImageFlag.value = '';

      await loadProducts();

      // If we created a new product, close the panel
      // If editing, keep the panel open and refresh details
      if (!editingProduct && savedId) {
         closePanel();
      } else if (editingProduct) {
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

  // Clear image preview and remove flag
  clearImagePreview();
  const removeFlag = document.getElementById('remove-image-flag');
  if (removeFlag) removeFlag.value = '';
}

/**
 * Initialize image upload functionality
 */
function initImageUpload() {
  const fileInput = document.getElementById('product-image-file');
  const removeBtn = document.getElementById('remove-image-btn');

  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          window.adminAPI.ui.showToast('Please select an image file', 'error');
          fileInput.value = '';
          return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          window.adminAPI.ui.showToast('Image must be less than 10MB', 'error');
          fileInput.value = '';
          return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Clear any remove flag since we're adding a new image
        const removeFlag = document.getElementById('remove-image-flag');
        if (removeFlag) removeFlag.value = '';
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      removeCurrentImage();
    });
  }
}

// Make functions available globally
window.showProductDetails = showProductDetails;
window.showAddProductPanel = showAddProductPanel;
window.toggleProductStatus = toggleProductStatus;
window.deleteProduct = deleteProduct;
window.closePanel = closePanel;
window.removeCurrentImage = removeCurrentImage;
