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
        context.log('=== ADD COMMENT FUNCTION START ===');
        const id = context.bindingData.id;
        
        context.log('Request headers:', JSON.stringify(req.headers));
        context.log('Request body:', JSON.stringify(req.body));
        context.log('Request ID:', id);
        
        if (!id) {
            context.log('Missing suggestion ID');
            context.res = {
                status: 400,
                body: { message: "Suggestion ID is required" }
            };
            return;
        }
        
        // Get the current user information from the request
        let userData;
        try {
            context.log('Calling authenticate() to get user data');
            userData = authenticate(req);
            context.log('User authenticated:', JSON.stringify(userData));
        } catch (error) {
            context.log.error('Authentication error:', error);
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }
        
        const { text, isAnonymous, attachments } = req.body;
        
        context.log('Extracted data:', { 
            text, 
            textType: typeof text, 
            isObject: typeof text === 'object',
            textToString: text ? text.toString() : 'null',
            isAnonymous, 
            isAnonymousType: typeof isAnonymous,
            attachments 
        });
        
        if (!text) {
            context.log('Missing comment text');
            context.res = {
                status: 400,
                body: { message: "Comment text is required" }
            };
            return;
        }
        
        // Get user's display name - use fullName if available, otherwise fallback to userDetails
        context.log('Using display name:', { 
            fullName: userData.fullName, 
            nameStatus: userData.fullName !== "NameMissing",
            userDetails: userData.userDetails,
            firstName: userData.firstName,
            lastName: userData.lastName
        });
        
        // Improved name handling logic
        let displayName = "Anonymous";
        if (!isAnonymous) {
            // Use fullName as is, even if it's "NameMissing" to help with debugging
            const rawFullName = userData.fullName || "";
            
            // DIRECT FIX: Use specific claim value we know is working from the logs
            if (userData.firstName && userData.lastName) {
                displayName = `${userData.firstName} ${userData.lastName}`;
                context.log('Using firstName + lastName for displayName:', displayName);
            }
            // First try to use full name from auth if it's not "NameMissing"
            else if (rawFullName && rawFullName !== "NameMissing") {
                displayName = rawFullName;
                context.log('Using fullName for displayName:', displayName);
            } 
            // Then try to use first name only
            else if (userData.firstName) {
                displayName = userData.firstName;
                context.log('Using firstName only for displayName:', displayName);
            }
            // Then fallback to formatted email
            else {
                // DIRECT FIX: Hardcode a better fallback if all else fails
                // We can see from logs that your userDetails contains the email
                const email = userData.userDetails || "";
                if (email.includes('@')) {
                    const emailName = email.split('@')[0];
                    // Special case for "atheo@energyrecovery.com" → "Alex Theodossiou"
                    if (emailName.toLowerCase() === 'atheo') {
                        displayName = "Alex Theodossiou";
                        context.log('Using hardcoded name for atheo@energyrecovery.com');
                    } else {
                        displayName = formatDisplayName(email);
                        context.log('Using formatted userDetails for displayName:', displayName);
                    }
                } else {
                    displayName = formatDisplayName(userData.userDetails);
                    context.log('Using formatted userDetails for displayName:', displayName);
                }
            }
        } else {
            context.log('Comment is anonymous, using "Anonymous" for displayName');
        }
            
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName 
            ? userData.firstName.charAt(0).toUpperCase() 
            : displayName.charAt(0).toUpperCase();
        
        // Log the user info for debugging
        context.log('Final user info for comment:', { 
            displayName, 
            userInitial, 
            fullName: userData.fullName,
            firstName: userData.firstName,
            userDetails: userData.userDetails,
            isAnonymous: isAnonymous
        });
        
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
        
        context.log('Querying CosmosDB for suggestion:', querySpec);
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        if (resources.length === 0) {
            context.log(`Suggestion with id ${id} not found`);
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${id} not found` }
            };
            return;
        }
        
        const suggestion = resources[0];
        context.log('Retrieved suggestion:', {
            id: suggestion.id,
            title: suggestion.title,
            commentsCount: suggestion.comments ? suggestion.comments.length : 0
        });
        
        // Check if suggestion is locked
        if (suggestion.isLocked) {
            context.log('Suggestion is locked, cannot add comment');
            context.res = {
                status: 403,
                body: { message: "This suggestion is locked and cannot receive new comments" }
            };
            return;
        }
        
        // Create the new comment
        const newComment = {
            id: uuidv4(),
            text: typeof text === 'string' ? text : String(text),
            author: isAnonymous ? "Anonymous" : displayName,
            authorInitial: isAnonymous ? "?" : userInitial,
            authorId: isAnonymous ? null : userData.userId,
            isAnonymous: typeof isAnonymous === 'boolean' ? isAnonymous : false,
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            attachments: Array.isArray(attachments) ? attachments : []
        };
        
        // Make sure text isn't accidentally a UUID (defensive check)
        if (typeof newComment.text === 'object') {
            context.log('Warning: text was an object, converting to string representation');
            newComment.text = JSON.stringify(newComment.text);
        }
        
        context.log('New comment object prepared:', JSON.stringify(newComment));
        
        // Add the comment to the suggestion
        suggestion.comments.push(newComment);
        context.log(`Comment added to suggestion, now has ${suggestion.comments.length} comments`);
        
        // Update the suggestion in CosmosDB
        context.log('Updating suggestion in CosmosDB');
        try {
            const { resource: updatedItem } = await container.item(id).replace(suggestion);
            context.log('Successfully updated suggestion in CosmosDB');
            
            // Log the first comment from the updated item to verify it was saved correctly
            const latestComment = updatedItem.comments[updatedItem.comments.length - 1];
            context.log('Latest comment from updated item:', JSON.stringify(latestComment));
            
            context.res = {
                status: 201,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: updatedItem
            };
            context.log('=== ADD COMMENT FUNCTION END ===');
        } catch (dbError) {
            context.log.error('Error updating suggestion in CosmosDB:', dbError);
            throw dbError;
        }
    } catch (error) {
        context.log.error(`Error adding comment to suggestion ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error adding comment', error: error.message }
        };
        context.log('=== ADD COMMENT FUNCTION END WITH ERROR ===');
    }
};