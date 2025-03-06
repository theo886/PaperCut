const { CosmosClient } = require("@azure/cosmos");
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    console.log(`MERGEPIN: Pin request received for suggestion ID: ${context.bindingData.id}`);
    console.log(`MERGEPIN: Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`MERGEPIN: Request body:`, JSON.stringify(req.body, null, 2));
    
    // Get the suggestion ID from route parameters
    const suggestionId = context.bindingData.id;
    
    // Get pin status from body
    const { isPinned } = req.body;
    
    if (suggestionId === undefined) {
        console.log(`MERGEPIN: Error - Suggestion ID is undefined`);
        context.res = {
            status: 400,
            body: { message: "Suggestion ID is required" }
        };
        return;
    }
    
    if (isPinned === undefined) {
        console.log(`MERGEPIN: Error - isPinned status is undefined`);
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
        console.log('MERGEPIN: User authenticated:', JSON.stringify(userData, null, 2));
    } catch (error) {
        console.log(`MERGEPIN: Authentication error:`, error.message);
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
    
    console.log(`MERGEPIN: Admin check - isAdmin: ${isAdmin}`);
    console.log(`MERGEPIN: User roles:`, JSON.stringify(userData.userRoles, null, 2));
    console.log(`MERGEPIN: x-admin-status header:`, req.headers['x-admin-status']);
    
    if (!isAdmin) {
        console.log(`MERGEPIN: Access denied - User is not an admin`);
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
        
        console.log(`MERGEPIN: Connecting to Cosmos DB - Database: ${databaseId}, Container: ${containerId}`);

        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);

        // Query for the suggestion instead of direct item lookup
        console.log(`MERGEPIN: Querying for suggestion with ID: ${suggestionId}`);
        const { resources: suggestions } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: suggestionId }]
        }).fetchAll();

        if (suggestions.length === 0) {
            console.log(`MERGEPIN: Error - Suggestion with ID ${suggestionId} not found`);
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${suggestionId} not found` }
            };
            return;
        }

        // Get the suggestion from the query results
        const suggestion = suggestions[0];
        console.log(`MERGEPIN: Found suggestion: ${suggestion.title}, Current pinned status: ${suggestion.isPinned}`);

        // Update the suggestion
        suggestion.isPinned = isPinned;
        console.log(`MERGEPIN: Setting isPinned to: ${isPinned}`);
        
        // Add to activity log
        if (!suggestion.activity) {
            suggestion.activity = [];
        }
        
        // Get user's display name - use fullName if available, otherwise fallback to "NameMissing"
        const displayName = userData.userDetails|| "NameMissing";
        // Get user's initial - prefer first name initial if available
        const userInitial = displayName.charAt(0).toUpperCase();
        
        suggestion.activity.push({
            id: Date.now().toString(),
            type: 'pin',
            status: isPinned ? 'pinned' : 'unpinned',
            timestamp: new Date().toISOString(),
            author: displayName,
            authorInitial: userInitial,
            authorId: userData.userId
        });
        console.log(`MERGEPIN: Added activity log entry for pin/unpin action by ${displayName}`);

        // Save the updated suggestion
        console.log(`MERGEPIN: Saving updated suggestion to database`);
        const { resource: updatedSuggestion } = await container.item(suggestionId).replace(suggestion);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: updatedSuggestion
        };
        console.log(`MERGEPIN: Successfully updated suggestion with ID: ${suggestionId}, new isPinned value: ${isPinned}`);

    } catch (error) {
        console.log(`MERGEPIN: Error updating suggestion: ${error.message}`);
        console.log(`MERGEPIN: Error details:`, error);
        context.res = {
            status: 500,
            body: { 
                message: "Error updating suggestion",
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        };
    }
};