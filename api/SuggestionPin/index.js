const { CosmosClient } = require("@azure/cosmos");
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    // Get the suggestion ID from route parameters
    const suggestionId = context.bindingData.id;
    
    // Get pin status from body
    const { isPinned } = req.body;
    
    if (suggestionId === undefined) {
        context.res = {
            status: 400,
            body: { message: "Suggestion ID is required" }
        };
        return;
    }
    
    if (isPinned === undefined) {
        context.res = {
            status: 400,
            body: { message: "isPinned status is required" }
        };
        return;
    }
    
    // Get the current user information from the request
    let userData;
    try {
        userData = authenticate(req);
        context.log('User authenticated:', userData);
    } catch (error) {
        context.res = {
            status: error.status || 401,
            body: { message: error.message || "Authentication required" }
        };
        return;
    }
    
    // Check if user is admin - from roles or custom header
    const isAdmin = userData.userRoles.includes('admin') || 
                   userData.userRoles.includes('administrator') || 
                   userData.userRoles.includes('Owner') ||
                   req.headers['x-admin-status'] === 'true';
    
    if (!isAdmin) {
        context.res = {
            status: 403,
            body: { message: "Only administrators can pin/unpin suggestions" }
        };
        return;
    }

    try {
        // Connect to Cosmos DB
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        const databaseId = process.env.COSMOS_DATABASE_ID;
        const containerId = process.env.COSMOS_CONTAINER_ID;

        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);

        // Query for the suggestion instead of direct item lookup
        const { resources: suggestions } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: suggestionId }]
        }).fetchAll();

        if (suggestions.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${suggestionId} not found` }
            };
            return;
        }

        // Get the suggestion from the query results
        const suggestion = suggestions[0];

        // Update the suggestion
        suggestion.isPinned = isPinned;
        
        // Add to activity log
        if (!suggestion.activity) {
            suggestion.activity = [];
        }
        
        // Get user's display name - use fullName if available, otherwise fallback to "NameMissing"
        const displayName = userData.fullName || "NameMissing";
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                         displayName.charAt(0).toUpperCase();
        
        suggestion.activity.push({
            id: Date.now().toString(),
            type: 'pin',
            status: isPinned ? 'pinned' : 'unpinned',
            timestamp: new Date().toISOString(),
            author: displayName,
            authorInitial: userInitial,
            authorId: userData.userId
        });

        // Save the updated suggestion
        const { resource: updatedSuggestion } = await container.item(suggestionId).replace(suggestion);

        context.res = {
            status: 200,
            body: updatedSuggestion
        };
    } catch (error) {
        context.log.error(`Error updating pin status for suggestion ${suggestionId}:`, error);
        context.res = {
            status: 500,
            body: { message: 'Error updating pin status', error: error.message }
        };
    }
};