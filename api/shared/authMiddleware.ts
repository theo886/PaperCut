import { AuthenticatedRequest, ClientPrincipal, UserData } from './types';

/**
 * Authenticates the request and extracts user information
 * @param req Express request object
 * @returns User information extracted from the client principal
 */
const authenticate = (req: AuthenticatedRequest): UserData => {
    const clientPrincipal: ClientPrincipal | null = req.headers['x-ms-client-principal']
        ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
        : null;

    if (!clientPrincipal) {
        throw { status: 401, message: "Authentication required" };
    }
    
    // Extract name from claims, similar to how the frontend does it
    let fullName = "NameMissing";
    let firstName: string | null = null;
    let lastName: string | null = null;
    
    if (clientPrincipal && clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
        // Look for the "name" claim
        const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
        if (nameClaim && nameClaim.val) {
          fullName = nameClaim.val; // Update local variable
        }
  
        // given name
        const firstNameClaim = clientPrincipal.claims.find(
          claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
        );
        if (firstNameClaim && firstNameClaim.val) {
          firstName = firstNameClaim.val;
        }
  
        // surname
        const lastNameClaim = clientPrincipal.claims.find(
          claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
        );
        if (lastNameClaim && lastNameClaim.val) {
          lastName = lastNameClaim.val;
        }
    }

    return {
        userId: clientPrincipal.userId,
        userDetails: clientPrincipal.userDetails,
        userRoles: clientPrincipal.userRoles || [],
        fullName: fullName,
        firstName: firstName,
        lastName: lastName,
        // Add name for backward compatibility
        name: fullName
    };
};

/**
 * Checks if the user has admin rights
 * @param userData User data from authenticate function
 * @param req Express request object
 * @throws Error with status 403 if user is not an admin
 */
const authorizeAdmin = (userData: UserData, req: AuthenticatedRequest): void => {
    const isAdminFromRoles = userData.userRoles.includes('admin') ||
                             userData.userRoles.includes('administrator') ||
                             userData.userRoles.includes('Owner');

    const isAdminFromHeader = req.headers['x-admin-status'] === 'true';

    if (!(isAdminFromRoles || isAdminFromHeader)) {
        throw { status: 403, message: "Admin rights required" };
    }
};

export { authenticate, authorizeAdmin }; 