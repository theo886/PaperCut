const { CosmosClient } = require("@azure/cosmos");
const { authenticate, authorizeAdmin } = require("../shared/authMiddleware");
const errorHandler = require("../shared/errorHandler");

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
        
        const userData = authenticate(req);
        authorizeAdmin(userData, req);
        
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        const databaseId = process.env.COSMOS_DATABASE_ID;
        const containerId = process.env.COSMOS_CONTAINER_ID;

        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Query for the suggestion instead of direct item lookup
        const { resources: suggestions } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: id }]
        }).fetchAll();
        
        if (suggestions.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${id} not found` }
            };
            return;
        }
        
        // Delete the suggestion from CosmosDB
        await container.item(id, id).delete();
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Suggestion deleted successfully' }
        };
    } catch (error) {
        errorHandler(context, error, 'Error deleting suggestion');
    }
}; 