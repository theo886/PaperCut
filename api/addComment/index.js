const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../shared/authMiddleware');

// Helper function to format display names from emails - keep as fallback
function formatDisplayName(email) {
    if (!email) return '';
    
    // Check if it's already a name (not an email)
    if (!email.includes('@')) {
        return email;
    }
    
    // Extract name part from email
    const namePart = email.split('@')[0];
    
    // Replace dots, underscores, or hyphens with spaces and capitalize each word
    return namePart
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = async function (context, req) {
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            context.res = {
                status: 400,
                body: { message: "Suggestion ID is required" }
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
        
        const { text, isAnonymous, attachments } = req.body;
        
        if (!text) {
            context.res = {
                status: 400,
                body: { message: "Comment text is required" }
            };
            return;
        }
        
        // Get user's display name - use fullName if available, otherwise fallback to userDetails
        const displayName = userData.fullName || userData.displayName || userData.userDetails;
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                          displayName.charAt(0).toUpperCase();
        
        const container = await getContainer();
        
        // Get the existing suggestion
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [
                {
                    name: "@id",
                    value: id
                }
            ]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        if (resources.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${id} not found` }
            };
            return;
        }
        
        const suggestion = resources[0];
        
        // Check if suggestion is locked
        if (suggestion.isLocked) {
            context.res = {
                status: 403,
                body: { message: "This suggestion is locked and cannot receive new comments" }
            };
            return;
        }
        
        // Create the new comment
        const newComment = {
            id: uuidv4(),
            text,
            author: isAnonymous ? "Anonymous" : displayName,
            authorInitial: isAnonymous ? "?" : userInitial,
            authorId: isAnonymous ? null : userData.userId,
            isAnonymous: isAnonymous || false,
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            attachments: attachments || []
        };
        
        // Add the comment to the suggestion
        suggestion.comments.push(newComment);
        
        // Update the suggestion in CosmosDB
        const { resource: updatedItem } = await container.item(id).replace(suggestion);
        
        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            },
            body: updatedItem
        };
    } catch (error) {
        context.log.error(`Error adding comment to suggestion ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error adding comment', error: error.message }
        };
    }
};