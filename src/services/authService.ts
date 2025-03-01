import { User } from '../types';

interface AuthPayload {
  clientPrincipal: User | null;
}

interface Claim {
  typ: string;
  val: string;
}

// Authentication service for Azure Static Web Apps auth
const authService = {
  // Get the current user information
  getUser: async (): Promise<User | null> => {
    try {
      const response = await fetch('/.auth/me');
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      const payload: AuthPayload = await response.json();
      const { clientPrincipal } = payload;
      
      // Enhanced logging to see the full structure
      console.log("Full auth payload:", payload);
      console.log("Client principal data:", clientPrincipal);
      
      if (!clientPrincipal) {
        return null;
      }
      
      // Extract full name from claims if available
      if (clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
        // Look for "name" claim specifically - this contains the full name "Alex Theodossiou"
        const nameClaim = clientPrincipal.claims.find((claim: Claim) => claim.typ === 'name');
        if (nameClaim && nameClaim.val) {
          clientPrincipal.fullName = nameClaim.val;
        }
        
        // Also get first and last name for use in avatars etc.
        const firstNameClaim = clientPrincipal.claims.find(
          (claim: Claim) => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
        );
        const lastNameClaim = clientPrincipal.claims.find(
          (claim: Claim) => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
        );
        
        if (firstNameClaim) {
          clientPrincipal.firstName = firstNameClaim.val;
        }
        
        if (lastNameClaim) {
          clientPrincipal.lastName = lastNameClaim.val;
        }
      }
      
      // Add display name if not present (for easier reference in UI)
      if (clientPrincipal && clientPrincipal.userDetails) {
        clientPrincipal.displayName = clientPrincipal.name;

        // Add initial for avatar
        if (clientPrincipal.firstName) {
          clientPrincipal.initial = clientPrincipal.firstName.charAt(0).toUpperCase();
        } else if (clientPrincipal.fullName) {
          clientPrincipal.initial = clientPrincipal.fullName.charAt(0).toUpperCase();
        } else if (clientPrincipal.userDetails) {
          clientPrincipal.initial = clientPrincipal.userDetails.charAt(0).toUpperCase();
        } else {
          clientPrincipal.initial = 'U';
        }
      }
      
      return clientPrincipal;
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  },

  // Login (redirects to login provider)
  login: (): void => {
    window.location.href = '/.auth/login/aad';
  },

  // Logout
  logout: (): void => {
    window.location.href = '/.auth/logout';
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const user = await authService.getUser();
    return !!user;
  }
};

export default authService; 