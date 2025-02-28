const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            context.res = {
                status: 400,
                body: { message: "ID parameter is required" }
            };
            return;
        }
        
        // Get the current user information from the request
        const clientPrincipal = req.headers['x-ms-client-principal']
            ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
            : null;
            
        if (!clientPrincipal) {
            context.res = {
                status: 401,
                body: { message: "Authentication required" }
            };
            return;
        }
        
        const userData = {
            userId: clientPrincipal.userId,
            userDetails: clientPrincipal.userDetails,
            userRoles: clientPrincipal.userRoles || []
        };
        
        // Check if user is admin - from roles or custom header
        const isAdminFromRoles = userData.userRoles.includes('admin') || 
                           userData.userRoles.includes('administrator') || 
                           userData.userRoles.includes('Owner');
        
        // Check for admin status from custom header
        const isAdminFromHeader = req.headers['x-admin-status'] === 'true';
        
        // User is admin if either condition is true
        const isAdmin = isAdminFromRoles || isAdminFromHeader;
        
        context.log('Admin check in deleteSuggestion:', { 
            userRoles: userData.userRoles,
            isAdminFromRoles,
            isAdminFromHeader, 
            adminHeader: req.headers['x-admin-status'], 
            finalAdminStatus: isAdmin 
        });
        
        if (!isAdmin) {
            context.res = {
                status: 403,
                body: { message: "Only administrators can delete suggestions" }
            };
            return;
        }
        
        // Connect to Cosmos DB directly, similar to SuggestionLock implementation
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        const databaseId = process.env.COSMOS_DATABASE_ID;
        const containerId = process.env.COSMOS_CONTAINER_ID;

        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Check if suggestion exists first
        try {
            const { resource: suggestion } = await container.item(id).read();
            
            if (!suggestion) {
                context.res = {
                    status: 404,
                    body: { message: `Suggestion with id ${id} not found` }
                };
                return;
            }
            
            // Delete the suggestion from CosmosDB
            await container.item(id).delete();
            
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: { message: 'Suggestion deleted successfully' }
            };
        } catch (itemError) {
            // If the item doesn't exist, CosmosDB will throw a 404 error
            if (itemError.code === 404) {
                context.res = {
                    status: 404,
                    body: { message: `Suggestion with id ${id} not found` }
                };
                return;
            }
            throw itemError; // Re-throw for other errors
        }
    } catch (error) {
        context.log.error(`Error deleting suggestion with id ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error deleting suggestion', error: error.message }
        };
    }
}; 