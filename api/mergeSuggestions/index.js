const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    try {
        // Extract the target and source IDs
        const { targetId, sourceId } = req.body;
        
        if (!targetId || !sourceId) {
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
            context.log('User authenticated:', userData);
        } catch (error) {
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
        
        if (!isAdmin) {
            context.res = {
                status: 403,
                body: { message: "Only administrators can merge suggestions" }
            };
            return;
        }
        
        const container = await getContainer();
        
        // Get the source suggestion
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
            context.res = {
                status: 404,
                body: { message: `Source suggestion with id ${sourceId} not found` }
            };
            return;
        }
        
        const sourceSuggestion = sourceResources[0];
        
        // Get the target suggestion
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
            context.res = {
                status: 404,
                body: { message: `Target suggestion with id ${targetId} not found` }
            };
            return;
        }
        
        const targetSuggestion = targetResources[0];
        
        // Get user's display name - use fullName if available, otherwise fallback to userDetails
        const displayName = userData.fullName || userData.displayName || userData.userDetails;
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                         displayName.charAt(0).toUpperCase();
        
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
        
        // Update the target suggestion
        const updatedTarget = { ...targetSuggestion };
        
        // Add activity record
        updatedTarget.activity = [...(updatedTarget.activity || []), mergeActivity];
        
        // Add the source suggestion to mergedWith array
        updatedTarget.mergedWith = [...(updatedTarget.mergedWith || []), {
            id: sourceId,
            title: sourceSuggestion.title, 
            timestamp: new Date().toISOString()
        }];
        
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
        const { resource: updatedTargetResource } = await container.item(targetId).replace(updatedTarget);
        
        // Delete the source suggestion from the database
        await container.item(sourceId, sourceId).delete();
        
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
        context.log.error('Error merging suggestions:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error merging suggestions', error: error.message }
        };
    }
};