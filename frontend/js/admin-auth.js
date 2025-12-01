/**
 * Admin Authentication Module
 * Handles admin login, session management, and route protection via backend API
 */

const API_BASE_URL = 'http://localhost:3000/api';
// Export to window for use in other modules
window.API_BASE_URL = API_BASE_URL;

// Session storage keys
const SESSION_KEY = 'admin_session';
const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

/**
 * Store session in localStorage
 */
function storeSession(session) {
  if (session && session.access_token) {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    if (session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user: session.user,
      expires_at: session.expires_at
    }));
  }
}

/**
 * Clear session from localStorage
 */
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Get stored token
 */
function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored session
 */
function getStoredSession() {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

/**
 * Check if session is expired
 */
function isSessionExpired() {
  const session = getStoredSession();
  if (!session || !session.expires_at) return true;
  return new Date(session.expires_at * 1000) < new Date();
}

/**
 * Get current user from stored session
 */
async function getCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  // Check if session is expired
  if (isSessionExpired()) {
    // Try to refresh
    const refreshed = await refreshSession();
    if (!refreshed) return null;
  }

  const session = getStoredSession();
  return session ? session.user : null;
}

/**
 * Get the current auth token
 */
async function getAuthToken() {
  const token = getStoredToken();
  if (!token) return null;

  // Check if session is expired
  if (isSessionExpired()) {
    // Try to refresh
    const refreshed = await refreshSession();
    if (!refreshed) return null;
    return getStoredToken();
  }

  return token;
}

/**
 * Refresh session using refresh token
 */
async function refreshSession() {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return false;
    }

    const data = await response.json();
    if (data.success && data.session) {
      storeSession(data.session);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error refreshing session:', error);
    clearSession();
    return false;
  }
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    console.log(data)
    if (data.success && data.session) {
      storeSession(data.session);
      return data;
    }

    throw new Error('Login failed: Invalid response');
  } catch (error) {
    throw error;
  }
}

/**
 * Sign out
 */
async function signOut() {
  try {
    const token = getStoredToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearSession();
  }
}

/**
 * Check if user is authenticated and is admin
 */
async function checkAdminAccess() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { isAdmin: false, user: null };
    }

    // Call backend to verify admin status
    const response = await fetch(`${API_BASE_URL}/admin/check`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { isAdmin: false, user: null };
    }

    const data = await response.json();
    return { isAdmin: data.isAdmin, user: data.user };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { isAdmin: false, user: null };
  }
}

// Export functions to window object for use in other modules
window.adminAuth = {
  signIn,
  signOut,
  getCurrentUser,
  getAuthToken,
  checkAdminAccess,
  refreshSession,
};

/**
 * Protect admin routes - redirect to login if not authenticated/admin
 */
async function protectAdminRoute() {
  const user = await getCurrentUser();

  if (!user) {
    // Not logged in, redirect to login
    window.location.href = '/admin/login.html';
    return false;
  }

  // Check if user is admin
  const { isAdmin, user: adminUser } = await checkAdminAccess();

  if (!isAdmin) {
    // User is logged in but not admin
    alert('Access denied. Admin privileges required.');
    await signOut();
    window.location.href = '/admin/login.html';
    return false;
  }

  // Update UI with user email
  const userEmailElements = document.querySelectorAll('#user-email');
  userEmailElements.forEach(el => {
    el.textContent = adminUser.email;
  });

  return true;
}

/**
 * Initialize login page
 */
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const loginBtn = document.getElementById('login-btn');

  // Check if already logged in
  getCurrentUser().then(user => {
    if (user) {
      // Check if admin and redirect
      checkAdminAccess().then(({ isAdmin }) => {
        if (isAdmin) {
          window.location.href = '/admin/dashboard.html';
        }
      });
    }
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Hide messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
      // Sign in
      await signIn(email, password);

      // Check if admin
      const { isAdmin } = await checkAdminAccess();

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Success
      successMessage.textContent = 'Login successful! Redirecting...';
      successMessage.style.display = 'block';

      setTimeout(() => {
        window.location.href = '/admin/dashboard.html';
      }, 1000);

    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });

  // Handle forgot password
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Please contact your administrator to reset your password.');
    });
  }
}

/**
 * Initialize logout functionality
 */
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut();
        window.location.href = '/admin/login.html';
      } catch (error) {
        alert('Error signing out: ' + error.message);
      }
    });
  }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('login.html')) {
    initLoginPage();
  } else if (path.includes('admin/')) {
    // Protect all other admin pages
    protectAdminRoute().then(isAuthorized => {
      if (isAuthorized) {
        initLogout();
      }
    });
  }
});

// Export functions for use in other modules
window.adminAuth = {
  getCurrentUser,
  getAuthToken,
  signIn,
  signOut,
  checkAdminAccess,
  protectAdminRoute,
};
