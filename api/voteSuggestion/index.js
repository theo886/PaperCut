const { getContainer } = require('../shared/cosmosClient');

module.exports = async function (context, req) {
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            context.res = {
                status: 400,
                body: { message: "Suggestion ID parameter is required" }
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
        
        const userId = clientPrincipal.userId;
        
        const container = await getContainer();
        
        // Get the existing suggestion
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [
                {
                    name: "@id",
                    value: id
                }
            ]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        if (resources.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${id} not found` }
            };
            return;
        }
        
        const suggestion = resources[0];
        
        // Initialize voters array if it doesn't exist
        if (!suggestion.voters) {
            suggestion.voters = [];
        }
        
        // Check if the user has already voted
        const alreadyVoted = suggestion.voters.includes(userId);
        
        if (alreadyVoted) {
            // Toggle off - remove the vote
            suggestion.votes -= 1;
            suggestion.voters = suggestion.voters.filter(voter => voter !== userId);
        } else {
            // Toggle on - add the vote
            suggestion.votes += 1;
            suggestion.voters.push(userId);
        }
        
        // Update the suggestion in CosmosDB
        const { resource: updatedSuggestion } = await container.item(id).replace(suggestion);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { 
                votes: updatedSuggestion.votes,
                hasVoted: !alreadyVoted // Toggle state - true if we just added the vote, false if we removed it
            }
        };
    } catch (error) {
        context.log.error(`Error voting on suggestion with id ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error voting on suggestion', error: error.message }
        };
    }
};