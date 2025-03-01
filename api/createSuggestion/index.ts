import { Context } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { getContainer } from '../shared/cosmosClient';
import { authenticate } from '../shared/authMiddleware';
import { AuthenticatedRequest, SuggestionFormData, Suggestion, Attachment } from '../shared/types';

export default async function (context: Context, req: AuthenticatedRequest): Promise<void> {
    try {
        // Get the current user information from the request using the authenticate middleware
        let userData;
        try {
            userData = authenticate(req);
        } catch (error: any) {
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }

        const { title, description, isAnonymous, attachments, departments } = req.body as SuggestionFormData;

        if (!title || !description) {
            context.res = {
                status: 400,
                body: { message: "Title and description are required" }
            };
            return;
        }

        // Determine the author name - use fullName if available, otherwise use "NameMissing"
        const authorName = isAnonymous ? "Anonymous" : 
                          (userData.fullName || "NameMissing");
        
        // Get initial for avatar - use first name's initial when available
        const authorInitial = isAnonymous ? "?" : 
                             (userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                             authorName.charAt(0).toUpperCase());

        const timestamp = new Date().toISOString();
        const container = await getContainer();

        // Create a new suggestion
        const newSuggestion: Omit<Suggestion, 'hasVoted'> = {
            id: uuidv4(),
            title,
            description,
            author: authorName,
            authorInitial: authorInitial,
            authorId: isAnonymous ? null : userData.userId,
            isAnonymous,
            status: 'New',
            departments: departments || [],
            votes: 0,
            voters: [],
            comments: [],
            activity: [],
            timestamp,
            effortScore: 0,
            impactScore: 0,
            priorityScore: 0,
            mergedWith: [],
            attachments: attachments || []
        };

        const { resource: createdItem } = await container.items.create(newSuggestion);

        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            },
            body: createdItem
        };
    } catch (error: any) {
        context.log.error('Error creating suggestion:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error creating suggestion', error: error.message }
        };
    }
}; 