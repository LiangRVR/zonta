const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided for authentication');
}

// Create Supabase client for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Login with email and password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message || 'Invalid credentials'
      });
    }

    // Check if user has admin role
    const serviceSupabase = require('../supabaseClient');
    const { data: roleData, error: roleError } = await serviceSupabase
      .from('user_roles')
      .select('roles(role_name)')
      .eq('user_id', data.user.id)
      .single();

    console.log('roleData', roleData)

    const isAdmin = roleData && roleData.roles && roleData.roles.role_name === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Return session and user data
    res.json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Unexpected login error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};

/**
 * Logout (invalidate session)
 */
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut(token);

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('Unexpected logout error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};

/**
 * Get current session/user
 */
const getSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Check if user is admin
    const serviceSupabase = require('../supabaseClient');
    const { data: roleData, error: roleError } = await serviceSupabase
      .from('user_roles')
      .select('roles(role_name)')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData && roleData.roles && roleData.roles.role_name === 'admin';

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: isAdmin ? 'admin' : 'user'
      },
      isAdmin
    });
  } catch (err) {
    console.error('Unexpected session error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required'
      });
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      console.error('Refresh token error:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message || 'Invalid refresh token'
      });
    }

    res.json({
      success: true,
      session: data.session
    });
  } catch (err) {
    console.error('Unexpected refresh error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};

module.exports = {
  login,
  logout,
  getSession,
  refreshToken,
};
