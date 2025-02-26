const { getContainer } = require('../shared/cosmosClient');

module.exports = async function (context, req) {
    try {
        const id = context.bindingData.id;
        
        if (!id) {
            context.res = {
                status: 400,
                body: { message: "ID parameter is required" }
            };
            return;
        }

        const container = await getContainer();
        
        // Query for the specific suggestion by ID
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
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: resources[0]
        };
    } catch (error) {
        context.log.error(`Error fetching suggestion with id ${context.bindingData.id}:`, error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error fetching suggestion', error: error.message }
        };
    }
};