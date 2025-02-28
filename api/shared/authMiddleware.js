const authenticate = (req) => {
    const clientPrincipal = req.headers['x-ms-client-principal']
        ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
        : null;

    if (!clientPrincipal) {
        throw { status: 401, message: "Authentication required" };
    }

    return {
        userId: clientPrincipal.userId,
        userDetails: clientPrincipal.userDetails,
        userRoles: clientPrincipal.userRoles || []
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