const { getContainer } = require('../shared/cosmosClient');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    try {
        context.log('Edit Comment function processing request');
        
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
        
        // Parse the comment text from the request body
        const { text } = req.body;
        
        if (!text || typeof text !== 'string' || text.trim() === '') {
            context.res = {
                status: 400,
                body: { message: "Comment text is required" }
            };
            return;
        }
        
        // Authenticate the user
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
        
        // Find the comment to edit
        const commentIndex = suggestion.comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            context.res = {
                status: 404,
                body: { message: "Comment not found" }
            };
            return;
        }
        
        const comment = suggestion.comments[commentIndex];
        
        // Check if user has permission to edit (admin or comment author)
        const isAdmin = userData.userRoles && userData.userRoles.includes('admin');
        const isAuthor = comment.authorId === userData.userId;
        
        context.log('User roles:', userData.userRoles);
        context.log('Is admin:', isAdmin);
        context.log('Is author:', isAuthor, 'Comment authorId:', comment.authorId, 'User ID:', userData.userId);
        
        if (!isAdmin && !isAuthor) {
            context.res = {
                status: 403,
                body: { message: "You don't have permission to edit this comment" }
            };
            return;
        }
        
        // Update the comment text and add an "edited" timestamp
        suggestion.comments[commentIndex] = {
            ...comment,
            text: text.trim(),
            editedTimestamp: new Date().toISOString(),
            editedBy: userData.userId
        };
        
        // Update the suggestion in the database
        const { resource: updatedSuggestion } = await container.item(suggestionId, suggestionId).replace(suggestion);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: updatedSuggestion
        };
    } catch (error) {
        context.log.error('Error editing comment:', error);
        context.log.error('Stack trace:', error.stack);
        context.res = {
            status: 500,
            body: { message: "Error editing comment", error: error.message, stack: error.stack }
        };
    }
}; 