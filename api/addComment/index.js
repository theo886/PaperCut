const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            context.res = {
                status: 400,
                body: { message: "Suggestion ID parameter is required" }
            };
            return;
        }
        
        // Get the current user information from the request
        const clientPrincipal = req.headers['x-ms-client-principal']
            ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
            : null;
            
        if (!clientPrincipal) {
            context.res = {
                status: 401,
                body: { message: "Authentication required" }
            };
            return;
        }
        
        const userData = {
            userId: clientPrincipal.userId,
            userDetails: clientPrincipal.userDetails,
            userRoles: clientPrincipal.userRoles || []
        };
        
        const { text, isAnonymous } = req.body;
        
        if (!text) {
            context.res = {
                status: 400,
                body: { message: "Comment text is required" }
            };
            return;
        }
        
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
        
        // Create the new comment
        const newComment = {
            id: uuidv4(),
            author: isAnonymous ? "Anonymous" : userData.userDetails,
            authorInitial: isAnonymous ? "?" : userData.userDetails.charAt(0).toUpperCase(),
            authorId: isAnonymous ? null : userData.userId,
            isAnonymous: isAnonymous || false,
            text,
            timestamp: new Date().toISOString(),
            likes: 0
        };
        
        // Add the comment to the suggestion
        suggestion.comments.push(newComment);
        
        // Update the suggestion in CosmosDB
        const { resource: updatedSuggestion } = await container.item(id).replace(suggestion);
        
        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            },
            body: newComment
        };
    } catch (error) {
        context.log.error(`Error adding comment to suggestion with id ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error adding comment', error: error.message }
        };
    }
};