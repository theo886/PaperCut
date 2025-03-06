const { getContainer } = require('../shared/cosmosClient');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    console.log(`MERGEPIN: Update suggestion request received for ID: ${context.bindingData.id}`);
    console.log(`MERGEPIN: Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`MERGEPIN: Request body:`, JSON.stringify(req.body, null, 2));
    
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            console.log(`MERGEPIN: Error - Missing suggestion ID`);
            context.res = {
                status: 400,
                body: { message: "ID parameter is required" }
            };
            return;
        }
        
        // Get the current user information from the request using the authenticate middleware
        let userData;
        try {
            userData = authenticate(req);
            console.log('MERGEPIN: User authenticated:', JSON.stringify(userData, null, 2));
        } catch (error) {
            console.log(`MERGEPIN: Authentication error:`, error.message);
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }
        
        // Check if user is admin - from roles or custom header
        const isAdminFromRoles = userData.userRoles.includes('admin') || 
                           userData.userRoles.includes('administrator') || 
                           userData.userRoles.includes('Owner');
        
        // Check for admin status from custom header
        const isAdminFromHeader = req.headers['x-admin-status'] === 'true';
        
        // User is admin if either condition is true
        const isAdmin = isAdminFromRoles || isAdminFromHeader;
        
        console.log(`MERGEPIN: Admin check details for status update:`);
        console.log(`MERGEPIN: - isAdminFromRoles: ${isAdminFromRoles}`);
        console.log(`MERGEPIN: - User roles:`, JSON.stringify(userData.userRoles, null, 2));
        console.log(`MERGEPIN: - isAdminFromHeader: ${isAdminFromHeader}`);
        console.log(`MERGEPIN: - x-admin-status header:`, req.headers['x-admin-status']);
        console.log(`MERGEPIN: - Final isAdmin result: ${isAdmin}`);
        
        const container = await getContainer();
        
        // Get the existing suggestion
        console.log(`MERGEPIN: Querying for suggestion with ID: ${id}`);
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
            console.log(`MERGEPIN: Error - Suggestion with ID ${id} not found`);
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${id} not found` }
            };
            return;
        }
        
        const existingSuggestion = resources[0];
        console.log(`MERGEPIN: Found suggestion: ${existingSuggestion.title}, Current status: ${existingSuggestion.status}`);
        
        // Check if user has permission to update this suggestion
        if (!isAdmin && existingSuggestion.authorId !== userData.userId) {
            console.log(`MERGEPIN: Error - User doesn't have permission to update this suggestion`);
            context.res = {
                status: 403,
                body: { message: "You don't have permission to update this suggestion" }
            };
            return;
        }
        
        const updatedData = { ...req.body };
        console.log(`MERGEPIN: Update data received:`, JSON.stringify(updatedData, null, 2));
        
        // Merge updated fields with existing suggestion
        // If user is not admin, only certain fields can be updated
        const updatedSuggestion = { ...existingSuggestion };

        // Get user's display name - use fullName if available, otherwise fallback to userDetails
        const displayName = userData.userDetails|| "NameMissing";
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                          displayName.charAt(0).toUpperCase();
        
        if (isAdmin) {
            // Admins can update all fields
            if (updatedData.status && updatedData.status !== existingSuggestion.status) {
                console.log(`MERGEPIN: Updating status from ${existingSuggestion.status} to ${updatedData.status}`);
                // Add activity record for status change
                const statusActivity = {
                    id: (existingSuggestion.activity.length + 1).toString(),
                    type: 'status',
                    from: existingSuggestion.status,
                    to: updatedData.status,
                    timestamp: new Date().toISOString(),
                    author: displayName,
                    authorInitial: userInitial,
                    authorId: userData.userId
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
        console.log(`MERGEPIN: Error updating suggestion:`, error.message);
        console.log(`MERGEPIN: Full error:`, error);
        
        context.res = {
            status: 500,
            body: { 
                message: "Error updating suggestion",
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        };
    }
};