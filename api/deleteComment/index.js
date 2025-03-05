const { CosmosClient } = require("@azure/cosmos");
const { authenticate } = require("../shared/authMiddleware");
const errorHandler = require("../shared/errorHandler");

module.exports = async function (context, req) {
    try {
        context.log('Delete Comment function processing a request');
        
        // Get the suggestion ID and comment ID from route parameters
        const suggestionId = context.bindingData.suggestionId;
        const commentId = context.bindingData.commentId;
        
        // Check if IDs are provided
        if (!suggestionId || !commentId) {
            context.res = {
                status: 400,
                body: { message: "Suggestion ID and Comment ID are required" }
            };
            return;
        }
        
        // Authenticate the user
        const userData = authenticate(req);
        if (!userData) {
            context.res = {
                status: 401,
                body: { message: "Authentication failed" }
            };
            return;
        }
        
        // Set up direct connection to Cosmos DB
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        const databaseId = process.env.COSMOS_DATABASE_ID;
        const containerId = process.env.COSMOS_CONTAINER_ID;

        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Query for the suggestion
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
        
        const suggestion = suggestions[0];
        
        // Find the comment
        const commentIndex = suggestion.comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            context.res = {
                status: 404,
                body: { message: "Comment not found" }
            };
            return;
        }
        
        const comment = suggestion.comments[commentIndex];
        
        // Check if user has permission to delete this comment (admin or the author)
        const isAdmin = userData.userRoles && userData.userRoles.includes('admin');
        const isAuthor = comment.authorId === userData.userId;
        
        context.log('User roles:', userData.userRoles);
        context.log('Is admin:', isAdmin);
        context.log('Is author:', isAuthor, 'Comment authorId:', comment.authorId, 'User ID:', userData.userId);
        
        if (!isAdmin && !isAuthor) {
            context.res = {
                status: 403,
                body: { message: "You don't have permission to delete this comment" }
            };
            return;
        }
        
        // Remove the comment
        suggestion.comments.splice(commentIndex, 1);
        
        // Update the suggestion
        const { resource: updatedSuggestion } = await container.item(suggestionId, suggestionId).replace(suggestion);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: updatedSuggestion
        };
    } catch (error) {
        errorHandler(context, error, 'Error deleting comment');
    }
}; 