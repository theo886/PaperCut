const authenticate = (req) => {
    const clientPrincipal = req.headers['x-ms-client-principal']
        ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
        : null;

    if (!clientPrincipal) {
        throw { status: 401, message: "Authentication required" };
    }
    
    // Extract full name from claims
    let fullName = null;
    let firstName = null;
    let lastName = null;
    
    if (clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
        // Try to find the name claim first (full name)
        const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
        if (nameClaim) {
            fullName = nameClaim.val;
        }
        
        // Also get first and last name separately (in case we need them)
        const firstNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
        );
        const lastNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
        );
        
        if (firstNameClaim) {
            firstName = firstNameClaim.val;
        }
        
        if (lastNameClaim) {
            lastName = lastNameClaim.val;
        }
        
        // If we couldn't find a full name claim, but we have first and last name, construct it
        if (!fullName && (firstName || lastName)) {
            fullName = [firstName, lastName].filter(Boolean).join(' ');
        }
    }
    
    // If we still don't have a full name, fallback to displayName or userDetails
    if (!fullName) {
        fullName = clientPrincipal.displayName || clientPrincipal.userDetails;
    }

    return {
        userId: clientPrincipal.userId,
        userDetails: clientPrincipal.userDetails,
        userRoles: clientPrincipal.userRoles || [],
        fullName: fullName,
        firstName: firstName,
        lastName: lastName
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