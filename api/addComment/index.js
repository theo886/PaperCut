const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../shared/authMiddleware');


module.exports = async function (context, req) {
    try {
        context.log(' CSL === ADD COMMENT FUNCTION START ===');
        const id = context.bindingData.id;
        
        context.log(' CSL Request headers:', JSON.stringify(req.headers));
        context.log(' CSL Request body:', JSON.stringify(req.body));
        context.log(' CSL Request ID:', id);
        
        if (!id) {
            context.log(' CSL Missing suggestion ID');
            context.res = {
                status: 400,
                body: { message: "Suggestion ID is required" }
            };
            return;
        }
        
        // Get the current user information from the request
        let userData;
        try {
            context.log(' CSL Calling authenticate() to get user data');
            userData = authenticate(req);
            context.log(' CSL User authenticated:', JSON.stringify(userData));
        } catch (error) {
            context.log.error('Authentication error:', error);
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }
        
        const { text, isAnonymous, attachments } = req.body;
        
        context.log(' CSL Extracted data:', { 
            text, 
            textType: typeof text, 
            isObject: typeof text === 'object',
            textToString: text ? text.toString() : 'null',
            isAnonymous, 
            isAnonymousType: typeof isAnonymous,
            attachments 
        });
        
        if (!text) {
            context.log(' CSL Missing comment text');
            context.res = {
                status: 400,
                body: { message: "Comment text is required" }
            };
            return;
        }
        
        // Get user's display name - use fullName if available, otherwise fallback to userDetails
        context.log(' CSL Using display name:', { 
            fullName: userData.fullName, 
            nameStatus: userData.fullName !== "NameMissing",
            userDetails: userData.userDetails,
            firstName: userData.firstName,
            lastName: userData.lastName
        });
        
        // Improved name handling logic
        let displayName = "Anonymous";
        if (!isAnonymous) {
                           displayName = userData.userDetails;
            context.log(' CSL Using formatted userDetails for displayName:', displayName);
        } else {
            context.log(' CSL Comment is anonymous, using "Anonymous" for displayName');
        }
            
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName 
            ? userData.firstName.charAt(0).toUpperCase() 
            : displayName.charAt(0).toUpperCase();
        
        // Log the user info for debugging
        context.log(' CSL Final user info for comment:', { 
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
        
        context.log(' CSL Querying CosmosDB for suggestion:', querySpec);
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
        context.log(' CSL Retrieved suggestion:', {
            id: suggestion.id,
            title: suggestion.title,
            commentsCount: suggestion.comments ? suggestion.comments.length : 0
        });
        
        // Check if suggestion is locked
        if (suggestion.isLocked) {
            context.log(' CSL Suggestion is locked, cannot add comment');
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
            context.log(' CSL Warning: text was an object, converting to string representation');
            newComment.text = JSON.stringify(newComment.text);
        }
        
        context.log(' CSL New comment object prepared:', JSON.stringify(newComment));
        
        // Add the comment to the suggestion
        suggestion.comments.push(newComment);
        context.log(`Comment added to suggestion, now has ${suggestion.comments.length} comments`);
        
        // Update the suggestion in CosmosDB
        context.log(' CSL Updating suggestion in CosmosDB');
        try {
            const { resource: updatedItem } = await container.item(id).replace(suggestion);
            context.log(' CSL Successfully updated suggestion in CosmosDB');
            
            // Log the first comment from the updated item to verify it was saved correctly
            const latestComment = updatedItem.comments[updatedItem.comments.length - 1];
            context.log(' CSL Latest comment from updated item:', JSON.stringify(latestComment));
            
            context.res = {
                status: 201,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: updatedItem
            };
            context.log(' CSL === ADD COMMENT FUNCTION END ===');
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
        context.log(' CSL === ADD COMMENT FUNCTION END WITH ERROR ===');
    }
};