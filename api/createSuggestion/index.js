const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    try {
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

        const { title, description, visibility, isAnonymous } = req.body;

        if (!title || !description) {
            context.res = {
                status: 400,
                body: { message: "Title and description are required" }
            };
            return;
        }

        const timestamp = new Date().toISOString();
        const container = await getContainer();

        // Create a new suggestion
        const newSuggestion = {
            id: uuidv4(),
            title,
            description,
            author: isAnonymous ? "Anonymous" : userData.userDetails,
            authorInitial: isAnonymous ? "?" : userData.userDetails.charAt(0).toUpperCase(),
            authorId: isAnonymous ? null : userData.userId,
            isAnonymous,
            status: 'New',
            departments: [],
            votes: 0,
            comments: [],
            activity: [],
            timestamp,
            visibility: visibility || 'Public',
            effortScore: 0,
            impactScore: 0,
            priorityScore: 0,
            mergedWith: []
        };

        const { resource: createdItem } = await container.items.create(newSuggestion);

        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            },
            body: createdItem
        };
    } catch (error) {
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