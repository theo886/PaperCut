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
    
    if (clientPrincipal && clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
        console.log("Auth middleware - All claims:", JSON.stringify(clientPrincipal.claims));
        
        // Look for the "name" claim
        const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
        if (nameClaim && nameClaim.val) {
            fullName = nameClaim.val;
        }
  
        // Look for given name
        const firstNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname' || 
                    claim.typ === 'given_name'
        );
        if (firstNameClaim && firstNameClaim.val) {
            firstName = firstNameClaim.val;
        }
  
        // Look for surname
        const lastNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname' || 
                    claim.typ === 'family_name'
        );
        if (lastNameClaim && lastNameClaim.val) {
            lastName = lastNameClaim.val;
        }
        
        // If we still don't have a full name but we have first and last, combine them
        if (fullName === "NameMissing" && firstName && lastName) {
            fullName = `${firstName} ${lastName}`;
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