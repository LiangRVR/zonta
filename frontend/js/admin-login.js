/**
 * Admin Login Page JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if already logged in
  const user = await window.adminAuth.getCurrentUser();
  if (user) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Setup login form
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

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
      const result = await window.adminAuth.signIn(email, password);

      if (result.success) {
        successMessage.textContent = 'Login successful! Redirecting...';
        successMessage.style.display = 'block';

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 500);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      errorMessage.textContent = error.message || 'Invalid email or password';
      errorMessage.style.display = 'block';

      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });

  // Forgot password link (placeholder)
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Please contact your administrator to reset your password.');
    });
  }
});
