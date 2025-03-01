const authenticate = (req) => {
    const clientPrincipal = req.headers['x-ms-client-principal']
        ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
        : null;

    if (!clientPrincipal) {
        throw { status: 401, message: "Authentication required" };
    }
    
    // Extract name from claims, similar to how the frontend does it
    let fullName = "NameMissing";
    let firstName = null;
    let lastName = null;
    
   // Extract full name from claims if available
   if (clientPrincipal && clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
    // Look for "name" claim specifically - this contains the full name "Alex Theodossiou"
    const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
    if (nameClaim && nameClaim.val) {
      clientPrincipal.fullName = nameClaim.val;
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
  
  // Add display name if not present (for easier reference in UI)
  if (clientPrincipal && clientPrincipal.userDetails) {
    clientPrincipal.displayName = clientPrincipal.name;
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

const authorizeAdmin = (userData, req) => {
    const isAdminFromRoles = userData.userRoles.includes('admin') ||
                             userData.userRoles.includes('administrator') ||
                             userData.userRoles.includes('Owner');

    const isAdminFromHeader = req.headers['x-admin-status'] === 'true';

    if (!(isAdminFromRoles || isAdminFromHeader)) {
        throw { status: 403, message: "Admin rights required" };
    }
};

module.exports = { authenticate, authorizeAdmin }; 