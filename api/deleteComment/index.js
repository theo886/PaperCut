const { getContainer } = require('../shared/cosmosClient');
const { authenticate } = require('../shared/authMiddleware');

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
        
        // Get the suggestion from the database
        const container = await getContainer();
        const { resource: suggestion } = await container.item(suggestionId).read();
        
        if (!suggestion) {
            context.res = {
                status: 404,
                body: { message: "Suggestion not found" }
            };
            return;
        }
        
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
        const isAdmin = userData.isAdmin;
        const isAuthor = comment.authorId === userData.userId;
        
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
        const { resource: updatedSuggestion } = await container.item(suggestionId).replace(suggestion);
        
        context.res = {
            status: 200,
            body: updatedSuggestion
        };
    } catch (error) {
        context.log.error('Error deleting comment:', error);
        context.res = {
            status: 500,
            body: { message: "Failed to delete comment", error: error.message }
        };
    }
}; 