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
        
        // Look for the "name" claim
        const nameClaim = clientPrincipal.claims.find(claim => claim.typ === 'name');
        console.log('Name claim:', nameClaim ? JSON.stringify(nameClaim) : 'not found');
        if (nameClaim && nameClaim.val) {
            fullName = nameClaim.val;
            console.log('Found name claim, setting fullName to:', fullName);
        }
  
        // Look for given name
        const firstNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname' || 
                    claim.typ === 'given_name'
        );
        console.log('First name claim:', firstNameClaim ? JSON.stringify(firstNameClaim) : 'not found');
        if (firstNameClaim && firstNameClaim.val) {
            firstName = firstNameClaim.val;
            console.log('Found first name claim, setting firstName to:', firstName);
        }
  
        // Look for surname
        const lastNameClaim = clientPrincipal.claims.find(
            claim => claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname' || 
                    claim.typ === 'family_name'
        );
        console.log('Last name claim:', lastNameClaim ? JSON.stringify(lastNameClaim) : 'not found');
        if (lastNameClaim && lastNameClaim.val) {
            lastName = lastNameClaim.val;
            console.log('Found last name claim, setting lastName to:', lastName);
        }
        
        // If we still don't have a full name but we have first and last, combine them
        if (fullName === "NameMissing" && firstName && lastName) {
            fullName = `${firstName} ${lastName}`;
            console.log('Constructed fullName from first and last name:', fullName);
        } else if (fullName === "NameMissing" && firstName) {
            fullName = firstName;
            console.log('Using firstName as fallback for fullName:', fullName);
        }
        
        // Try to find ANY name-like claim if we still don't have one
        if (fullName === "NameMissing") {
            console.log('Still missing name, checking all claims for anything name-like');
            const nameRelatedClaims = clientPrincipal.claims.filter(claim => 
                claim.typ.toLowerCase().includes('name') && claim.val && claim.val.trim() !== ''
            );
            console.log('Name-related claims found:', nameRelatedClaims.length);
            if (nameRelatedClaims.length > 0) {
                nameRelatedClaims.forEach(claim => {
                    console.log(`Potential name claim: ${claim.typ} = ${claim.val}`);
                });
                // Use the first one we find
                const bestClaimMatch = nameRelatedClaims[0];
                if (bestClaimMatch) {
                    fullName = bestClaimMatch.val;
                    console.log('Using alternative name claim:', fullName);
                }
            }
        }
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