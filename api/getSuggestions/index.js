const { getContainer } = require('../shared/cosmosClient');

module.exports = async function (context, req) {
    try {
        const container = await getContainer();
        
        // Query all items in the container
        const querySpec = {
            query: "SELECT * FROM c"
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: resources
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