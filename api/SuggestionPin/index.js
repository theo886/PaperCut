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
    
    // Only admins can pin/unpin
    if (!isAdmin) {
        context.res = {
            status: 403,
            body: { message: "Permission denied: Admin rights required" }
        };
        return;
    }

    const suggestionId = context.bindingData.id;
    const { isPinned } = req.body;

    if (isPinned === undefined) {
        context.res = {
            status: 400,
            body: { message: "Request must include isPinned property" }
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

        // Get the suggestion
        const { resource: suggestion } = await container.item(suggestionId).read();

        if (!suggestion) {
            context.res = {
                status: 404,
                body: { message: "Suggestion not found" }
            };
            return;
        }

        // Update the suggestion
        suggestion.isPinned = isPinned;
        
        // Add to activity log
        if (!suggestion.activity) {
            suggestion.activity = [];
        }
        
        suggestion.activity.push({
            id: Date.now().toString(),
            type: 'pin',
            status: isPinned ? 'pinned' : 'unpinned',
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
        context.log.error(`Error pinning/unpinning suggestion: ${error.message}`);
        context.res = {
            status: 500,
            body: { message: `Error updating suggestion: ${error.message}` }
        };
    }
};