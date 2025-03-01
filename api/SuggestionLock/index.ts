import { AzureFunction, Context } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { authenticate } from '../shared/authMiddleware';
import { AuthenticatedRequest, Suggestion, Activity, UserData, LockSuggestionRequestBody } from '../shared/types';

const suggestionLock: AzureFunction = async function (context: Context, req: AuthenticatedRequest): Promise<void> {
    // Get the suggestion ID from route parameters
    const suggestionId = context.bindingData.id as string;
    
    // Get lock status from body
    const { isLocked } = req.body as LockSuggestionRequestBody;
    
    if (suggestionId === undefined) {
        context.res = {
            status: 400,
            body: { message: "Suggestion ID is required" }
        };
        return;
    }
    
    if (isLocked === undefined) {
        context.res = {
            status: 400,
            body: { message: "isLocked status is required" }
        };
        return;
    }
    
    // Get the current user information from the request
    let userData: UserData;
    try {
        userData = authenticate(req);
        context.log('User authenticated:', userData);
    } catch (error: any) {
        context.res = {
            status: error.status || 401,
            body: { message: error.message || "Authentication required" }
        };
        return;
    }
    
    // Check if user is admin - from roles or custom header
    const isAdmin = userData.userRoles.includes('admin') || 
                   userData.userRoles.includes('administrator') || 
                   userData.userRoles.includes('Owner') ||
                   req.headers['x-admin-status'] === 'true';
    
    if (!isAdmin) {
        context.res = {
            status: 403,
            body: { message: "Only administrators can lock/unlock suggestions" }
        };
        return;
    }

    try {
        // Connect to Cosmos DB
        const endpoint = process.env.COSMOS_ENDPOINT || '';
        const key = process.env.COSMOS_KEY || '';
        const databaseId = process.env.COSMOS_DATABASE_ID || '';
        const containerId = process.env.COSMOS_CONTAINER_ID || '';

        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);

        // Query for the suggestion instead of direct item lookup
        const { resources: suggestions } = await container.items.query<Suggestion>({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: suggestionId }]
        }).fetchAll();

        if (suggestions.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${suggestionId} not found` }
            };
            return;
        }

        // Get the suggestion from the query results
        const suggestion = suggestions[0];

        // Update the suggestion
        suggestion.isLocked = isLocked;
        
        // Add to activity log
        if (!suggestion.activity) {
            suggestion.activity = [];
        }
        
        // Get user's display name - use fullName if available, otherwise fallback to "NameMissing"
        const displayName = userData.fullName || "NameMissing";
        // Get user's initial - prefer first name initial if available
        const userInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                         displayName.charAt(0).toUpperCase();
        
        const newActivity: Activity = {
            id: Date.now().toString(),
            type: 'lock',
            status: isLocked ? 'locked' : 'unlocked',
            timestamp: new Date().toISOString(),
            author: displayName,
            authorInitial: userInitial,
            authorId: userData.userId
        };
        
        suggestion.activity.push(newActivity);

        // Save the updated suggestion
        const { resource: updatedSuggestion } = await container.item(suggestionId).replace(suggestion);

        context.res = {
            status: 200,
            body: updatedSuggestion
        };
    } catch (error: any) {
        context.log.error(`Error updating lock status for suggestion ${suggestionId}:`, error);
        context.res = {
            status: 500,
            body: { message: 'Error updating lock status', error: error.message }
        };
    }
};

export default suggestionLock; 