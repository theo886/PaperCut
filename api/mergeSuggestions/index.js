const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    console.log(`MERGEPIN: Merge suggestions request received`);
    console.log(`MERGEPIN: Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`MERGEPIN: Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`MERGEPIN: Route params:`, JSON.stringify(context.bindingData, null, 2));
    
    try {
        // Extract the target ID from route parameters and source ID from body
        const targetId = context.bindingData.targetId;
        const { sourceId } = req.body;
        
        console.log(`MERGEPIN: Attempting to merge source ID ${sourceId} into target ID ${targetId}`);
        
        if (!targetId || !sourceId) {
            console.log(`MERGEPIN: Error - Missing required IDs. targetId: ${targetId}, sourceId: ${sourceId}`);
            context.res = {
                status: 400,
                body: { message: "Both targetId and sourceId are required" }
            };
            return;
        }
        
        // Get the current user information from the request
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
        
        console.log(`MERGEPIN: Admin check details:`);
        console.log(`MERGEPIN: - isAdminFromRoles: ${isAdminFromRoles}`);
        console.log(`MERGEPIN: - User roles:`, JSON.stringify(userData.userRoles, null, 2));
        console.log(`MERGEPIN: - isAdminFromHeader: ${isAdminFromHeader}`);
        console.log(`MERGEPIN: - x-admin-status header:`, req.headers['x-admin-status']);
        console.log(`MERGEPIN: - Final isAdmin result: ${isAdmin}`);
        
        if (!isAdmin) {
            console.log(`MERGEPIN: Access denied - User is not an admin`);
            context.res = {
                status: 403,
                body: { message: "Only administrators can merge suggestions" }
            };
            return;
        }
        
        console.log(`MERGEPIN: Getting database container`);
        const container = await getContainer();
        
        // Get the source suggestion
        console.log(`MERGEPIN: Querying for source suggestion with ID: ${sourceId}`);
        const sourceQuery = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [
                {
                    name: "@id",
                    value: sourceId
                }
            ]
        };
        
        const { resources: sourceResources } = await container.items.query(sourceQuery).fetchAll();
        
        if (sourceResources.length === 0) {
            console.log(`MERGEPIN: Error - Source suggestion with ID ${sourceId} not found`);
            context.res = {
                status: 404,
                body: { message: `Source suggestion with id ${sourceId} not found` }
            };
            return;
        }
        
        const sourceSuggestion = sourceResources[0];
        console.log(`MERGEPIN: Found source suggestion: ${sourceSuggestion.title}`);
        
        // Get the target suggestion
        console.log(`MERGEPIN: Querying for target suggestion with ID: ${targetId}`);
        const targetQuery = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [
                {
                    name: "@id",
                    value: targetId
                }
            ]
        };
        
        const { resources: targetResources } = await container.items.query(targetQuery).fetchAll();
        
        if (targetResources.length === 0) {
            console.log(`MERGEPIN: Error - Target suggestion with ID ${targetId} not found`);
            context.res = {
                status: 404,
                body: { message: `Target suggestion with id ${targetId} not found` }
            };
            return;
        }
        
        const targetSuggestion = targetResources[0];
        console.log(`MERGEPIN: Found target suggestion: ${targetSuggestion.title}`);
        
        // Get user's display name - use fullName if available, otherwise fallback to "NameMissing"
        const displayName = userData.userDetails|| "Admin";
        // Get user's initial - prefer first name initial if available
        const userInitial =displayName.charAt(0).toUpperCase();
        
        // Prepare the merge action activity entry
        const mergeActivity = {
            id: uuidv4(),
            type: 'merge',
            sourceId: sourceId,
            sourceTitle: sourceSuggestion.title,
            timestamp: new Date().toISOString(),
            author: displayName,
            authorInitial: userInitial,
            authorId: userData.userId
        };
        console.log(`MERGEPIN: Created merge activity entry for user: ${displayName}`);
        
        // Update the target suggestion
        const updatedTarget = { ...targetSuggestion };
        console.log(`MERGEPIN: Beginning merge process - copying source suggestion data to target`);
        
        // Add activity record
        updatedTarget.activity = [...(updatedTarget.activity || []), mergeActivity];
        
        // Add the source suggestion to mergedWith array
        updatedTarget.mergedWith = [...(updatedTarget.mergedWith || []), {
            id: sourceId,
            title: sourceSuggestion.title, 
            timestamp: new Date().toISOString()
        }];
        console.log(`MERGEPIN: Added source suggestion to mergedWith array in target`);
        
        // Merge votes
        updatedTarget.votes += sourceSuggestion.votes;
        
        // Merge voters (avoiding duplicates)
        const sourceVoters = sourceSuggestion.voters || [];
        const targetVoters = updatedTarget.voters || [];
        updatedTarget.voters = [...new Set([...targetVoters, ...sourceVoters])];
        
        // Create a system comment with the source suggestion's description
        const descriptionComment = {
            id: uuidv4(),
            text: `*Merged from suggestion "${sourceSuggestion.title}"*:\n\n${sourceSuggestion.description}`,
            author: "System",
            authorInitial: "S",
            authorId: null,
            isAnonymous: false,
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            attachments: sourceSuggestion.attachments || [],
            fromMerged: true,
            isMergeDescription: true,
            originalSuggestionId: sourceId,
            originalSuggestionTitle: sourceSuggestion.title
        };
        
        // Add the description comment first, then add all other comments
        const sourceComments = sourceSuggestion.comments || [];
        updatedTarget.comments = [
            ...(updatedTarget.comments || []),
            descriptionComment,
            ...sourceComments.map(comment => ({
                ...comment,
                id: uuidv4(), // Generate new ID to avoid conflicts
                fromMerged: true,
                originalSuggestionId: sourceId,
                originalSuggestionTitle: sourceSuggestion.title
            }))
        ];
        
        // Update the target suggestion in the database
        console.log(`MERGEPIN: Updating target suggestion in database`);
        const { resource: updatedTargetResource } = await container.item(targetId).replace(updatedTarget);
        
        // Delete the source suggestion from the database
        console.log(`MERGEPIN: Deleting source suggestion with ID: ${sourceId}`);
        await container.item(sourceId, sourceId).delete();
        
        console.log(`MERGEPIN: Merge completed successfully`);
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                target: updatedTargetResource,
                source: null // Source is now deleted, so return null
            }
        };
    } catch (error) {
        console.log(`MERGEPIN: Error during merge operation: ${error.message}`);
        console.log(`MERGEPIN: Error details:`, error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error merging suggestions', error: error.message }
        };
    }
};