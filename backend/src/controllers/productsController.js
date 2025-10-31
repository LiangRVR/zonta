const supabase = require('../supabaseClient');

/**
 * Get all products from Supabase
 */
const getAllProducts = async (req, res) => {
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
 * Get a single product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Product not found'
        });
      }
      console.error('Error fetching product:', error);
      return res.status(500).json({
        error: 'Failed to fetch product',
        details: error.message
      });
    }

    res.json({
      success: true,
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
 * Get products by category
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by category:', error);
      return res.status(500).json({
        error: 'Failed to fetch products',
        details: error.message
      });
    }

    res.json({
      success: true,
      category,
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
 * Get available product categories
 */
const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({
        error: 'Failed to fetch categories',
        details: error.message
      });
    }

    // Get unique categories
    const uniqueCategories = [...new Set(data.map(item => item.category))];

    res.json({
      success: true,
      count: uniqueCategories.length,
      categories: uniqueCategories
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
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getCategories
};
