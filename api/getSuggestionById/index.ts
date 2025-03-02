import { Context } from "@azure/functions";
import { getContainer } from '../shared/cosmosClient';
import { AuthenticatedRequest, Suggestion } from '../shared/types';

export default async function (context: Context, req: AuthenticatedRequest): Promise<void> {
    try {
        const id = context.bindingData.id as string;
        
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
        
        // Get the current user information from the request
        const clientPrincipal = req.headers['x-ms-client-principal']
            ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'] as string, 'base64').toString('ascii'))
            : null;
            
        const userId = clientPrincipal?.userId || null;
            
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        if (resources.length === 0) {
            context.res = {
                status: 404,
                body: { message: `Suggestion with id ${id} not found` }
            };
            return;
        }
        
        // Add hasVoted property based on current user
        const suggestion = resources[0] as Suggestion;
        const hasVoted = suggestion.voters && suggestion.voters.includes(userId);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                ...suggestion,
                hasVoted
            }
        };
    } catch (error: any) {
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