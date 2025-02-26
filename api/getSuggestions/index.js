const { getContainer } = require('../shared/cosmosClient');

module.exports = async function (context, req) {
    try {
        // Get the current user information from the request
        const clientPrincipal = req.headers['x-ms-client-principal']
            ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
            : null;
            
        const userId = clientPrincipal?.userId || null;
        
        const container = await getContainer();
        
        // Query all items in the container
        const querySpec = {
            query: "SELECT * FROM c"
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        
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
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error fetching suggestions', error: error.message }
        };
    }
};