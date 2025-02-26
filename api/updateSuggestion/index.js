const { getContainer } = require('../shared/cosmosClient');

module.exports = async function (context, req) {
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            context.res = {
                status: 400,
                body: { message: "ID parameter is required" }
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
        
        const isAdmin = userData.userRoles.includes('admin') || userData.userRoles.includes('administrator') || userData.userRoles.includes('Owner');
        
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
        
        const existingSuggestion = resources[0];
        
        // Check if user has permission to update this suggestion
        if (!isAdmin && existingSuggestion.authorId !== userData.userId) {
            context.res = {
                status: 403,
                body: { message: "You don't have permission to update this suggestion" }
            };
            return;
        }
        
        const updatedData = { ...req.body };
        
        // Merge updated fields with existing suggestion
        // If user is not admin, only certain fields can be updated
        const updatedSuggestion = { ...existingSuggestion };
        
        if (isAdmin) {
            // Admins can update all fields
            if (updatedData.status && updatedData.status !== existingSuggestion.status) {
                // Add activity record for status change
                const statusActivity = {
                    id: (existingSuggestion.activity.length + 1).toString(),
                    type: 'status',
                    from: existingSuggestion.status,
                    to: updatedData.status,
                    timestamp: new Date().toISOString(),
                    author: userData.userDetails,
                    authorInitial: userData.userDetails.charAt(0).toUpperCase()
                };
                updatedSuggestion.activity = [...existingSuggestion.activity, statusActivity];
                updatedSuggestion.status = updatedData.status;
            }
            
            // Update scores if provided
            if (updatedData.effortScore !== undefined) {
                updatedSuggestion.effortScore = updatedData.effortScore;
            }
            
            if (updatedData.impactScore !== undefined) {
                updatedSuggestion.impactScore = updatedData.impactScore;
            }
            
            // Recalculate priority if impact or effort changed
            if (updatedData.effortScore !== undefined || updatedData.impactScore !== undefined) {
                updatedSuggestion.priorityScore = (6 - updatedSuggestion.effortScore) * updatedSuggestion.impactScore;
            }
            
            // Update departments if provided
            if (updatedData.departments) {
                updatedSuggestion.departments = updatedData.departments;
            }
        } else {
            // Regular users can only update title and description of their own suggestions
            if (updatedData.title) {
                updatedSuggestion.title = updatedData.title;
            }
            
            if (updatedData.description) {
                updatedSuggestion.description = updatedData.description;
            }
        }
        
        // Update the suggestion in CosmosDB
        const { resource: updatedItem } = await container.item(id).replace(updatedSuggestion);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: updatedItem
        };
    } catch (error) {
        context.log.error(`Error updating suggestion with id ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error updating suggestion', error: error.message }
        };
    }
};