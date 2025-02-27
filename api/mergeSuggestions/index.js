const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    try {
        const targetId = context.bindingData.targetId;
        
        if (!targetId) {
            context.res = {
                status: 400,
                body: { message: "Target suggestion ID is required" }
            };
            return;
        }
        
        const { sourceId } = req.body;
        
        if (!sourceId) {
            context.res = {
                status: 400,
                body: { message: "Source suggestion ID is required in the request body" }
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
        
        // Check if user is admin - from roles or custom header
        const isAdminFromRoles = userData.userRoles.includes('admin') || 
                            userData.userRoles.includes('administrator') || 
                            userData.userRoles.includes('Owner');
        
        // Check for admin status from custom header
        const isAdminFromHeader = req.headers['x-admin-status'] === 'true';
        
        // User is admin if either condition is true
        const isAdmin = isAdminFromRoles || isAdminFromHeader;
        
        context.log('Admin check:', { 
            userRoles: userData.userRoles,
            isAdminFromRoles,
            isAdminFromHeader, 
            adminHeader: req.headers['x-admin-status'], 
            finalAdminStatus: isAdmin 
        });
        
        if (!isAdmin) {
            context.res = {
                status: 403,
                body: { message: "Only administrators can merge suggestions" }
            };
            return;
        }
        
        const container = await getContainer();
        
        // Get both suggestions
        const getTargetSuggestion = container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: targetId }]
        }).fetchAll();
        
        const getSourceSuggestion = container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: sourceId }]
        }).fetchAll();
        
        const [targetResult, sourceResult] = await Promise.all([getTargetSuggestion, getSourceSuggestion]);
        
        const targetSuggestions = targetResult.resources;
        const sourceSuggestions = sourceResult.resources;
        
        if (targetSuggestions.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Target suggestion with id ${targetId} not found` }
            };
            return;
        }
        
        if (sourceSuggestions.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Source suggestion with id ${sourceId} not found` }
            };
            return;
        }
        
        const targetSuggestion = targetSuggestions[0];
        const sourceSuggestion = sourceSuggestions[0];
        
        // Prepare the merge action activity entry
        const mergeActivity = {
            id: uuidv4(),
            type: 'merge',
            sourceId: sourceId,
            sourceTitle: sourceSuggestion.title,
            timestamp: new Date().toISOString(),
            author: userData.userDetails,
            authorInitial: userData.userDetails.charAt(0).toUpperCase(),
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
        
        // Merge comments
        const sourceComments = sourceSuggestion.comments || [];
        updatedTarget.comments = [
            ...(updatedTarget.comments || []),
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
        
        // Mark the source suggestion as merged and inactive
        const updatedSource = { ...sourceSuggestion };
        updatedSource.status = 'Merged';
        updatedSource.mergedInto = {
            id: targetId,
            title: targetSuggestion.title,
            timestamp: new Date().toISOString()
        };
        
        const { resource: updatedSourceResource } = await container.item(sourceId).replace(updatedSource);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                message: 'Suggestions merged successfully',
                target: updatedTargetResource,
                source: updatedSourceResource
            }
        };
    } catch (error) {
        context.log.error(`Error merging suggestions:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error merging suggestions', error: error.message }
        };
    }
};