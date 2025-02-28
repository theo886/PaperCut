const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    // Check for authentication
    if (!req.headers["x-ms-client-principal"]) {
        context.res = {
            status: 401,
            body: { message: "Authentication required" }
        };
        return;
    }

    // Parse the client principal
    const header = req.headers["x-ms-client-principal"];
    const principal = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    const userEmail = principal.userDetails;
    const userId = principal.userId;

    // Check if request has admin header for admin-only actions
    const isAdmin = req.headers["x-admin-status"] === "true";
    
    // Only admins can lock/unlock
    if (!isAdmin) {
        context.res = {
            status: 403,
            body: { message: "Permission denied: Admin rights required" }
        };
        return;
    }

    const suggestionId = context.bindingData.id;
    const { isLocked } = req.body;

    if (isLocked === undefined) {
        context.res = {
            status: 400,
            body: { message: "Request must include isLocked property" }
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
        suggestion.isLocked = isLocked;
        
        // Add to activity log
        if (!suggestion.activity) {
            suggestion.activity = [];
        }
        
        suggestion.activity.push({
            id: Date.now().toString(),
            type: 'lock',
            status: isLocked ? 'locked' : 'unlocked',
            timestamp: new Date().toISOString(),
            author: principal.userDetails,
            authorInitial: principal.userDetails.charAt(0).toUpperCase(),
            authorId: principal.userId
        });

        // Save the updated suggestion
        const { resource: updatedSuggestion } = await container.item(suggestionId).replace(suggestion);

        context.res = {
            status: 200,
            body: updatedSuggestion
        };
    } catch (error) {
        context.log.error(`Error locking/unlocking suggestion: ${error.message}`);
        context.res = {
            status: 500,
            body: { message: `Error updating suggestion: ${error.message}` }
        };
    }
};