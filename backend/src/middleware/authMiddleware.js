const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided for auth middleware');
}

/**
 * Middleware to verify user is authenticated via Supabase
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create a Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to verify user has admin role
 * Must be used after requireAuth middleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Use service role client to check admin status
    const supabase = require('../supabaseClient');

    // Query user_roles table to check if user is admin
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(role_name)')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data || !data.roles || data.roles.role_name !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // User is admin, allow access
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin verification failed'
    });
  }
};

/**
 * Helper function to get user role (for use in controllers)
 */
const getUserRole = async (userId) => {
  try {
    const supabase = require('../supabaseClient');

    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(role_name)')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.roles) {
      return 'user'; // Default to regular user
    }

    return data.roles.role_name;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  getUserRole,
};
