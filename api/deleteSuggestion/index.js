const { getContainer } = require('../shared/cosmosClient');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    context.log('Delete Suggestion function processing a request');
    
    try {
        // Get the current user information from the request
        let userData;
        try {
            userData = authenticate(req);
            context.log('Authentication successful, user data:', userData);
        } catch (error) {
            context.log.error('Authentication error:', error);
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }
        
        // Get the suggestion ID from the request parameters
        const suggestionId = req.params.id;
        context.log(`Request to delete suggestion with ID: ${suggestionId}`);
        
        if (!suggestionId) {
            context.log.warn('Missing suggestion ID');
            context.res = {
                status: 400,
                body: { message: "Suggestion ID is required" }
            };
            return;
        }

        // Get the container
        let container;
        try {
            container = await getContainer();
            context.log('Container retrieved successfully');
        } catch (dbError) {
            context.log.error('Error getting Cosmos DB container:', dbError);
            throw new Error(`Database connection error: ${dbError.message}`);
        }

        // Get the suggestion
        let suggestion;
        try {
            const { resource } = await container.item(suggestionId, suggestionId).read();
            suggestion = resource;
            context.log('Successfully retrieved suggestion:', { id: suggestion.id, title: suggestion.title });
        } catch (dbError) {
            context.log.error('Error retrieving suggestion from Cosmos DB:', dbError);
            context.res = {
                status: 404,
                body: { message: "Suggestion not found", error: dbError.message }
            };
            return;
        }

        // Check if the current user is the author of the suggestion or an admin
        if (suggestion.authorId !== userData.userId && !userData.isAdmin) {
            context.log.warn('Unauthorized deletion attempt', { 
                suggestionAuthorId: suggestion.authorId, 
                requestUserId: userData.userId, 
                isAdmin: userData.isAdmin 
            });
            context.res = {
                status: 403,
                body: { message: "You are not authorized to delete this suggestion" }
            };
            return;
        }

        // Delete the suggestion
        try {
            await container.item(suggestionId, suggestionId).delete();
            context.log('Successfully deleted suggestion with ID:', suggestionId);
        } catch (dbError) {
            context.log.error('Error deleting suggestion from Cosmos DB:', dbError);
            throw new Error(`Database delete error: ${dbError.message}`);
        }

        context.res = {
            status: 200,
            body: { message: "Suggestion deleted successfully" }
        };
    } catch (error) {
        context.log.error('Error deleting suggestion:', error);
        context.log.error('Stack trace:', error.stack);
        context.res = {
            status: 500,
            body: { message: "Error deleting suggestion", error: error.message, stack: error.stack }
        };
    }
}; 