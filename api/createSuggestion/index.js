const { getContainer } = require('../shared/cosmosClient');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../shared/authMiddleware');

// Helper function for formatting display names from emails (as fallback)
function formatDisplayName(email) {
    if (!email) return '';
    
    // Check if it's already a name (not an email)
    if (!email.includes('@')) {
        return email;
    }
    
    // Extract name part from email
    const namePart = email.split('@')[0];
    
    // Replace dots, underscores, or hyphens with spaces and capitalize each word
    return namePart
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = async function (context, req) {
    try {
        // Get the current user information from the request using the authenticate middleware
        let userData;
        try {
            userData = authenticate(req);
        } catch (error) {
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }

        const { title, description, isAnonymous, attachments, departments } = req.body;

        if (!title || !description) {
            context.res = {
                status: 400,
                body: { message: "Title and description are required" }
            };
            return;
        }

        // Determine the author name - use fullName if available, otherwise fallback to formatted email
        const authorName = isAnonymous ? "Anonymous" : 
                          (userData.fullName || formatDisplayName(userData.userDetails));
        
        // Get initial for avatar - use first name's initial when available
        const authorInitial = isAnonymous ? "?" : 
                             (userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
                             authorName.charAt(0).toUpperCase());

        const timestamp = new Date().toISOString();
        const container = await getContainer();

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