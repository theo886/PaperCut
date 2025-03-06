const { getContainer } = require('../shared/cosmosClient');

module.exports = async function (context, req) {
    try {
        context.log('Fetching suggestions - request received');
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        // Get the current user information from the request
        const clientPrincipal = req.headers['x-ms-client-principal']
            ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
            : null;
            
        const userId = clientPrincipal?.userId || null;
        context.log('User ID from client principal:', userId);
        
        context.log('Getting container from cosmosClient');
        const container = await getContainer();
        context.log('Container retrieved successfully');
        
        // First, get a count of all items to check if there are any issues
        const countQuerySpec = {
            query: "SELECT VALUE COUNT(1) FROM c"
        };
        
        const { resources: countResult } = await container.items.query(countQuerySpec).fetchAll();
        const totalCount = countResult[0];
        context.log(`Total number of items in container: ${totalCount}`);
        
        // Query all items without pagination first to inspect them all
        const allItemsQuery = {
            query: "SELECT * FROM c"
        };
        
        context.log('Fetching all items to inspect');
        const { resources: allItems } = await container.items.query(allItemsQuery).fetchAll();
        
        // Log details about each item to identify potential issues
        context.log(`Retrieved ${allItems.length} items total`);
        allItems.forEach((item, index) => {
            if (!item || !item.id) {
                context.log.warn(`Item at index ${index} is malformed or empty:`, item);
            } else if (Object.keys(item).length < 5) { // Check for suspiciously small objects
                context.log.warn(`Item at index ${index} with ID ${item.id} may be incomplete:`, item);
            }
        });
        
        // Now query with pagination for the actual response
        const querySpec = {
            query: "SELECT * FROM c ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit",
            parameters: [
                { name: "@offset", value: offset },
                { name: "@limit", value: pageSize }
            ]
        };
        
        context.log(`Executing paginated query with offset ${offset} and limit ${pageSize}`);
        const { resources } = await container.items.query(querySpec).fetchAll();
        context.log(`Retrieved ${resources.length} items for current page`);
        
        // Check each item in the current page
        resources.forEach((item, index) => {
            if (!item || !item.id) {
                context.log.error(`Item at index ${index} in current page is malformed:`, item);
            } else {
                context.log(`Item ${index}: id=${item.id}, title=${item.title || 'NO TITLE'}`);
            }
        });
        
        // Add hasVoted property to each suggestion based on current user
        const suggestionsWithVoteStatus = resources.map(suggestion => {
            // Check if user has voted for this suggestion
            const hasVoted = suggestion.voters && suggestion.voters.includes(userId);
            
            return {
                ...suggestion,
                hasVoted
            };
        });
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: suggestionsWithVoteStatus
        };
    } catch (error) {
        context.log.error('Error fetching suggestions:', error);
        context.log.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error fetching suggestions', error: error.message, stack: error.stack }
        };
    }
};