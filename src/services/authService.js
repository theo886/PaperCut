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
      
      // Enhanced logging to see the full structure
      console.log("Full auth payload:", payload);
      console.log("Client principal data:", clientPrincipal);
      
      // Add display name if not present (for easier reference in UI)
      if (clientPrincipal && clientPrincipal.userDetails) {
        // First, check if there's a name field we're not using
        if (clientPrincipal.name) {
          clientPrincipal.displayName = clientPrincipal.name;
        } else if (clientPrincipal.fullName) {
          clientPrincipal.displayName = clientPrincipal.fullName;
        } else {
          // Fall back to email parsing logic
          clientPrincipal.displayName = clientPrincipal.userDetails;
          
          // If user details contains an email, try to extract a better name
          if (clientPrincipal.userDetails.includes('@')) {
            const namePart = clientPrincipal.userDetails.split('@')[0];
            // Format: replace dots, underscores, or hyphens with spaces and capitalize
            clientPrincipal.displayName = namePart
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }
      
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
