// Authentication service for Azure Static Web Apps auth
const authService = {
  // Get the current user information
  getUser: async () => {
    try {
      const response = await fetch('/.auth/me');
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      const payload = await response.json();
      const { clientPrincipal } = payload;
      return clientPrincipal;
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  },

  // Login (redirects to login provider)
  login: () => {
    window.location.href = '/.auth/login/aad';
  },

  // Logout
  logout: () => {
    window.location.href = '/.auth/logout';
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const user = await authService.getUser();
    return !!user;
  }
};

export default authService;
