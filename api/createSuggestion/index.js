const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    context.log('Create Suggestion function processing a request');
    
    try {
        // Get the current user information from the request using the authenticate middleware
        let userData;
        context.log('About to call authenticate');
        try {
            userData = authenticate(req);
            context.log('Authentication successful, user data:', userData);
        } catch (error) {
            context.log.error('Authentication error:', error);
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }

        context.log('Request body:', req.body);
        const { title, description, isAnonymous, attachments, departments } = req.body;

        if (!title || !description) {
            context.log.warn('Missing required fields, title or description');
            context.res = {
                status: 400,
                body: { message: "Title and description are required" }
            };
            return;
        }

        // Determine the author name - use fullName if available, otherwise use "NameMissing"
        const authorName = isAnonymous ? "Anonymous" : 
                          (userData.userDetails|| "NameMissing");
        
        // Get initial for avatar - use first name's initial when available
        const authorInitial = isAnonymous ? "?" : 
                             authorName.charAt(0).toUpperCase();

        const timestamp = new Date().toISOString();
        
        context.log('Getting container from cosmosClient');
        let container;
        try {
            container = await getContainer();
            context.log('Container retrieved successfully');
        } catch (dbError) {
            context.log.error('Error getting Cosmos DB container:', dbError);
            throw new Error(`Database connection error: ${dbError.message}`);
        }

        // Create a new suggestion
        const newSuggestion = {
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
            comments: [],
            activity: [],
            timestamp,
            effortScore: 0,
            impactScore: 0,
            priorityScore: 0,
            mergedWith: [],
            attachments: attachments || []
        };
        
        context.log('Created suggestion object, about to save to database:', { 
            id: newSuggestion.id,
            title: newSuggestion.title
        });
        
        let createdItem;
        try {
            const result = await container.items.create(newSuggestion);
            createdItem = result.resource;
            context.log('Successfully saved suggestion to database, id:', createdItem.id);
        } catch (dbError) {
            context.log.error('Error saving to Cosmos DB:', dbError);
            context.log.error('Error details:', {
                code: dbError.code,
                message: dbError.message,
                body: dbError.body
            });
            throw new Error(`Database save error: ${dbError.message}`);
        }

        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            },
            body: createdItem
        };
    } catch (error) {
        context.log.error('Error creating suggestion:', error);
        context.log.error('Stack trace:', error.stack);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error creating suggestion', error: error.message, stack: error.stack }
        };
    }
};