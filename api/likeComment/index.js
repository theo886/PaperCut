const { getContainer } = require('../shared/cosmosClient');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    try {
        context.log('Like Comment function processing a request');
        
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
        
        // Check if user already liked this comment
        const likedByIndex = comment.likedBy ? comment.likedBy.findIndex(id => id === userData.userId) : -1;
        
        // Initialize likedBy array if it doesn't exist
        if (!comment.likedBy) {
            comment.likedBy = [];
        }
        
        // Toggle like status
        if (likedByIndex === -1) {
            // Add user to likedBy array and increment likes count
            comment.likedBy.push(userData.userId);
            comment.likes = (comment.likes || 0) + 1;
        } else {
            // Remove user from likedBy array and decrement likes count
            comment.likedBy.splice(likedByIndex, 1);
            comment.likes = Math.max(0, (comment.likes || 1) - 1);
        }
        
        // Update the suggestion
        const { resource: updatedSuggestion } = await container.item(suggestionId).replace(suggestion);
        
        context.res = {
            status: 200,
            body: updatedSuggestion
        };
    } catch (error) {
        context.log.error('Error liking comment:', error);
        context.res = {
            status: 500,
            body: { message: "Failed to like comment", error: error.message }
        };
    }
}; 