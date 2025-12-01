const supabase = require('../supabaseClient');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper: Extract storage path from public URL
 */
function extractStoragePath(publicUrl, bucket = 'products-images') {
  if (!publicUrl) return null;

  // URL format: https://<project>.supabase.co/storage/v1/object/public/products-images/path/to/file.ext
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;

  return publicUrl.substring(idx + marker.length);
}

/**
 * Helper: Upload image to Supabase Storage
 */
async function uploadProductImage(file) {
  if (!file) return null;

  const ext = file.originalname.split('.').pop().toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  if (!allowedExts.includes(ext)) {
    throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp');
  }

  const fileName = `products/${uuidv4()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('products-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('products-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Helper: Delete image from Supabase Storage
 */
async function deleteProductImage(imageUrl) {
  if (!imageUrl) return;

  const storagePath = extractStoragePath(imageUrl);
  if (!storagePath) return;

  const { error } = await supabase.storage
    .from('products-images')
    .remove([storagePath]);

  if (error) {
    console.error('Error deleting image from storage:', error);
    // Don't throw - image deletion failure shouldn't block product operations
  }
}

/**
 * Get all orders with optional filtering
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 100, offset = 0, sort = 'created_at', order = 'desc' } = req.query;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({
        error: 'Failed to fetch orders',
        details: error.message
      });
    }

    res.json({
      success: true,
      count: data.length,
      total: count,
      orders: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Get single order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      console.error('Error fetching order:', error);
      return res.status(500).json({
        error: 'Failed to fetch order',
        details: error.message
      });
    }

    res.json({
      success: true,
      order: data
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'refunded', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      console.error('Error updating order:', error);
      return res.status(500).json({
        error: 'Failed to update order',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: data
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Get order statistics
 */
const getOrderStats = async (req, res) => {
  try {
    // Get total orders and revenue
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) {
      console.error('Error fetching orders for stats:', ordersError);
      return res.status(500).json({
        error: 'Failed to fetch statistics',
        details: ordersError.message
      });
    }

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      ordersByStatus: {},
      recentOrders: [],
      monthlyRevenue: {}
    };

    // Count orders by status
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    stats.ordersByStatus = statusCounts;

    // Calculate monthly revenue (current year)
    const currentYear = new Date().getFullYear();
    orders
      .filter(order => new Date(order.created_at).getFullYear() === currentYear)
      .forEach(order => {
        const month = new Date(order.created_at).toLocaleString('default', { month: 'short' });
        stats.monthlyRevenue[month] = (stats.monthlyRevenue[month] || 0) + parseFloat(order.total_amount || 0);
      });

    // Get recent orders (last 10)
    stats.recentOrders = orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Calculate average order value
    stats.averageOrderValue = stats.totalOrders > 0
      ? stats.totalRevenue / stats.totalOrders
      : 0;

    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Get all products (including inactive)
 */
const getAllProductsAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({
        error: 'Failed to fetch products',
        details: error.message
      });
    }

    res.json({
      success: true,
      count: data.length,
      products: data
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Create new product (with optional image upload)
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, display_order, active } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Handle image upload if file is provided
    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadProductImage(req.file);
      } catch (uploadError) {
        return res.status(400).json({ error: uploadError.message });
      }
    }

    const productData = {
      name,
      description: description || null,
      price: parseFloat(price),
      image: imageUrl,
      display_order: display_order !== undefined ? parseInt(display_order) : 0,
      active: active === 'true' || active === true
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      // If DB insert fails, clean up uploaded image
      if (imageUrl) {
        await deleteProductImage(imageUrl);
      }
      console.error('Error creating product:', error);
      return res.status(500).json({
        error: 'Failed to create product',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: data
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Update product (with optional new image upload)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, display_order, active } = req.body;

    // Fetch existing product to get current image URL
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Error fetching product:', fetchError);
      return res.status(500).json({
        error: 'Failed to fetch product',
        details: fetchError.message
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (active !== undefined) updateData.active = active === 'true' || active === true;

    // Handle image upload if new file is provided
    let oldImageUrl = existingProduct.image;
    if (req.file) {
      try {
        const newImageUrl = await uploadProductImage(req.file);
        updateData.image = newImageUrl;
      } catch (uploadError) {
        return res.status(400).json({ error: uploadError.message });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // If DB update fails and we uploaded a new image, clean it up
      if (updateData.image && updateData.image !== oldImageUrl) {
        await deleteProductImage(updateData.image);
      }
      console.error('Error updating product:', error);
      return res.status(500).json({
        error: 'Failed to update product',
        details: error.message
      });
    }

    // If update succeeded and we uploaded a new image, delete the old one
    if (updateData.image && oldImageUrl && updateData.image !== oldImageUrl) {
      await deleteProductImage(oldImageUrl);
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: data
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Delete product (and its image from Storage)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Fetch product to get image URL before deleting
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Error fetching product:', fetchError);
      return res.status(500).json({
        error: 'Failed to fetch product',
        details: fetchError.message
      });
    }

    if (permanent === 'true') {
      // Permanently delete
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({
          error: 'Failed to delete product',
          details: error.message
        });
      }

      // Delete image from Storage
      if (product.image) {
        await deleteProductImage(product.image);
      }

      res.json({
        success: true,
        message: 'Product deleted permanently'
      });
    } else {
      // Mark as inactive (soft delete) - keep the image
      const { data, error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating product:', error);
        return res.status(500).json({
          error: 'Failed to deactivate product',
          details: error.message
        });
      }

      res.json({
        success: true,
        message: 'Product deactivated successfully',
        product: data
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Check if current user is admin
 */
const checkAdminStatus = async (req, res) => {
  try {
    // User is already verified as admin by middleware
    res.json({
      success: true,
      isAdmin: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Get admin overview data for dashboard
 * Returns KPIs, recent orders, and sales data for chart
 */
const getOverview = async (req, res) => {
  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) {
      console.error('Error fetching orders for overview:', ordersError);
      return res.status(500).json({
        error: 'Failed to fetch overview data',
        details: ordersError.message
      });
    }

    // Calculate date ranges
    const now = new Date();

    // Start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Filter paid orders (completed transactions)
    const paidStatuses = ['paid', 'preparing', 'shipped', 'delivered'];
    const paidOrders = orders.filter(order => paidStatuses.includes(order.status));

    // Calculate KPIs
    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const totalOrders = orders.length;

    // Week revenue
    const weekRevenue = paidOrders
      .filter(order => {
        const orderDate = new Date(order.paid_at || order.created_at);
        return orderDate >= startOfWeek;
      })
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

    // Month revenue
    const monthRevenue = paidOrders
      .filter(order => {
        const orderDate = new Date(order.paid_at || order.created_at);
        return orderDate >= startOfMonth;
      })
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

    // Recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        customer: order.customer_name || order.customer_email || 'N/A',
        email: order.customer_email,
        status: order.status,
        total: parseFloat(order.total_amount || 0),
        date: order.created_at
      }));

    // Sales last 7 days
    const salesLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayRevenue = paidOrders
        .filter(order => {
          const orderDate = new Date(order.paid_at || order.created_at);
          return orderDate >= date && orderDate < nextDate;
        })
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

      salesLast7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue
      });
    }

    res.json({
      success: true,
      totalRevenue,
      totalOrders,
      weekRevenue,
      monthRevenue,
      recentOrders,
      salesLast7Days
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

/**
 * Helper: Escape CSV field value
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Export orders as CSV
 */
const exportOrdersCSV = async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply date filters using created_at column
    if (from) {
      // Start of the 'from' day
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', fromDate.toISOString());
    }

    if (to) {
      // End of the 'to' day
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders for export:', error);
      return res.status(500).json({
        error: 'Failed to fetch orders',
        details: error.message
      });
    }

    // Define CSV columns
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Status',
      'Total Amount',
      'Shipping Address',
      'City',
      'State',
      'Zip Code',
      'Country',
      'Items',
      'Created At',
      'Paid At',
      'Stripe Session ID'
    ];

    // Build CSV rows
    const rows = orders.map(order => {
      // Parse items to get a summary
      let itemsSummary = '';
      if (order.items) {
        try {
          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          itemsSummary = items.map(item => `${item.name} x${item.quantity}`).join('; ');
        } catch (e) {
          itemsSummary = 'Unable to parse items';
        }
      }

      return [
        order.id,
        order.customer_name || '',
        order.customer_email || '',
        order.customer_phone || '',
        order.status || '',
        order.total_amount || 0,
        order.shipping_address || '',
        order.shipping_city || '',
        order.shipping_state || '',
        order.shipping_zip || '',
        order.shipping_country || '',
        itemsSummary,
        order.created_at || '',
        order.paid_at || '',
        order.stripe_session_id || ''
      ].map(escapeCSVField).join(',');
    });

    // Combine header and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');

    // Send the CSV content
    res.send(csvContent);

  } catch (err) {
    console.error('Unexpected error exporting orders:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  checkAdminStatus,
  getOverview,
  exportOrdersCSV,
};
