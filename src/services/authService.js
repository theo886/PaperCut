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
      console.log("UserDetails value:", clientPrincipal?.userDetails);
      
      if (clientPrincipal && clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
        console.log("All claims:", clientPrincipal.claims);
        
        // Look for email claims in various formats
        const emailClaims = clientPrincipal.claims.filter(claim => 
          claim.typ.toLowerCase().includes('email') || 
          claim.typ.includes('upn')
        );
        console.log("Potential email claims:", emailClaims);
        
        // Look for "name" claim specifically - this contains the full name
        const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
        if (nameClaim && nameClaim.val) {
          clientPrincipal.fullName = nameClaim.val;
        } else {
          clientPrincipal.fullName = "NameMissing";
        }
        
        // Also get first and last name for use in avatars etc.
        const firstNameClaim = clientPrincipal.claims.find(
          claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
        );
        const lastNameClaim = clientPrincipal.claims.find(
          claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
        );
        
        if (firstNameClaim) {
          clientPrincipal.firstName = firstNameClaim.val;
        }
        
        if (lastNameClaim) {
          clientPrincipal.lastName = lastNameClaim.val;
        }
      }
      
      // Set display name without falling back to userDetails/email
      if (clientPrincipal) {
        clientPrincipal.displayName = clientPrincipal.fullName || "NameMissing";
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
