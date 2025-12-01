const supabase = require('../supabaseClient');

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
 * Create new product
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, image_url, stock, display_order, active } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const productData = {
      name,
      description: description || null,
      price: parseFloat(price),
      category: category || null,
      image: image || null,
      image_url: image_url || null,
      stock: stock !== undefined ? parseInt(stock) : 0,
      display_order: display_order !== undefined ? parseInt(display_order) : 0,
      active: active !== undefined ? active : true
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
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
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, image_url, stock, display_order, active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (image !== undefined) updateData.image = image;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (active !== undefined) updateData.active = active;

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
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Error updating product:', error);
      return res.status(500).json({
        error: 'Failed to update product',
        details: error.message
      });
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
 * Delete product (or mark as inactive)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

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

      res.json({
        success: true,
        message: 'Product deleted permanently'
      });
    } else {
      // Mark as inactive (soft delete)
      const { data, error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Product not found' });
        }
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
};
