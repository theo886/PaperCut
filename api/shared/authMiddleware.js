const authenticate = (req) => {
    console.log('=== AUTH MIDDLEWARE START ===');
    console.log('Headers:', JSON.stringify(req.headers));
    
    const clientPrincipalHeader = req.headers['x-ms-client-principal'];
    console.log('Raw client principal header:', clientPrincipalHeader);
    
    const clientPrincipal = clientPrincipalHeader
        ? JSON.parse(Buffer.from(clientPrincipalHeader, 'base64').toString('ascii'))
        : null;
    
    console.log('Decoded client principal:', clientPrincipal ? JSON.stringify(clientPrincipal) : 'null');

    if (!clientPrincipal) {
        console.log('No client principal found!');
        throw { status: 401, message: "Authentication required" };
    }
    
    // Extract name from claims, similar to how the frontend does it
    let fullName = "NameMissing";
    let firstName = null;
    let lastName = null;
    
    if (clientPrincipal && clientPrincipal.claims && Array.isArray(clientPrincipal.claims)) {
        console.log("All available claims:", JSON.stringify(clientPrincipal.claims));
        
        // Look for the "name" claim - same as what works in the frontend
        const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
        console.log('Name claim:', nameClaim ? JSON.stringify(nameClaim) : 'not found');
        if (nameClaim && nameClaim.val) {
            fullName = nameClaim.val;
            console.log('Found name claim, setting fullName to:', fullName);
        }
  
        // Get first name for initial
        const firstNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname' || 
                    claim.typ === 'given_name'
        );
        console.log('First name claim:', firstNameClaim ? JSON.stringify(firstNameClaim) : 'not found');
        if (firstNameClaim && firstNameClaim.val) {
            firstName = firstNameClaim.val;
            console.log('Found first name claim, setting firstName to:', firstName);
        }
  
        // Get last name (only storing for completeness)
        const lastNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname' || 
                    claim.typ === 'family_name'
        );
        console.log('Last name claim:', lastNameClaim ? JSON.stringify(lastNameClaim) : 'not found');
        if (lastNameClaim && lastNameClaim.val) {
            lastName = lastNameClaim.val;
            console.log('Found last name claim, setting lastName to:', lastName);
        }
        
        // No fallbacks - just use name or NameMissing
    }
    
    const userData = {
        userId: clientPrincipal.userId,
        userDetails: clientPrincipal.userDetails,
        userRoles: clientPrincipal.userRoles || [],
        fullName: fullName,
        firstName: firstName,
        lastName: lastName,
        // Add name for backward compatibility
        name: fullName
    };
    
    console.log('Final user data being returned:', JSON.stringify(userData));
    console.log('=== AUTH MIDDLEWARE END ===');

    return userData;
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