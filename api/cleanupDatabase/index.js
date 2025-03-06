const { getContainer } = require('../shared/cosmosClient');
const { authenticate, authorizeAdmin } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    try {
        context.log('Cleanup Database function triggered');
        
        // Authenticate user and ensure they are admin
        let userData;
        try {
            userData = authenticate(req);
            authorizeAdmin(userData, req);
            context.log('Authentication successful, user is admin:', userData);
        } catch (error) {
            context.log.error('Authentication or authorization error:', error);
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }
        
        // Get the container
        let container;
        try {
            container = await getContainer();
            context.log('Container retrieved successfully');
        } catch (dbError) {
            context.log.error('Error getting Cosmos DB container:', dbError);
            throw new Error(`Database connection error: ${dbError.message}`);
        }
        
        // Fetch all items from the database
        const querySpec = {
            query: "SELECT * FROM c"
        };
        
        const { resources: allItems } = await container.items.query(querySpec).fetchAll();
        context.log(`Retrieved ${allItems.length} items from database`);
        
        // Check each item for validity
        const problemItems = [];
        const validItems = [];
        
        allItems.forEach(item => {
            // Basic validation criteria
            const isValid = item && 
                          item.id && 
                          item.title && 
                          item.description && 
                          item.timestamp &&
                          typeof item === 'object' &&
                          Object.keys(item).length >= 5;
            
            if (isValid) {
                validItems.push(item);
            } else {
                problemItems.push({
                    id: item?.id || 'unknown',
                    item: item || null,
                    reason: 'Missing required fields or structure'
                });
            }
        });
        
        context.log(`Found ${validItems.length} valid items and ${problemItems.length} problematic items`);
        
        // Delete the problematic items if confirmation is provided
        const confirmDelete = req.query.confirm === 'true';
        const deletedItems = [];
        
        if (confirmDelete && problemItems.length > 0) {
            context.log('Deleting problematic items...');
            
            for (const problem of problemItems) {
                if (problem.id && problem.id !== 'unknown') {
                    try {
                        await container.item(problem.id, problem.id).delete();
                        deletedItems.push(problem.id);
                        context.log(`Deleted problematic item with ID: ${problem.id}`);
                    } catch (deleteError) {
                        context.log.error(`Error deleting item ${problem.id}:`, deleteError);
                    }
                }
            }
            
            context.log(`Successfully deleted ${deletedItems.length} problematic items`);
        }
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                message: confirmDelete ? 'Database cleanup completed' : 'Database scan completed (dry run)',
                totalItems: allItems.length,
                validItems: validItems.length,
                problemItems: problemItems,
                deletedItems: deletedItems
            }
        };
    } catch (error) {
        context.log.error('Error cleaning up database:', error);
        context.log.error('Stack trace:', error.stack);
        context.res = {
            status: 500,
            body: { 
                message: 'Error cleaning up database', 
                error: error.message, 
                stack: error.stack 
            }
        };
    }
}; 