import { CosmosClient, Database, Container } from '@azure/cosmos';

// Initialize the Cosmos client
const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE_ID || 'papercut-db';
const containerId = process.env.COSMOS_CONTAINER_ID || 'suggestions';

const client = new CosmosClient({ endpoint, key });
let database: Database;
let container: Container;

/**
 * Initialize the Cosmos DB client, database, and container
 * @returns The database and container objects
 */
async function init(): Promise<{ database: Database; container: Container }> {
  // Create the database if it doesn't exist
  const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
  database = db;
  
  // Create the container if it doesn't exist
  const { container: cont } = await database.containers.createIfNotExists({ 
    id: containerId,
    partitionKey: { paths: ['/id'] }
  });
  container = cont;
  
  return { database, container };
}

/**
 * Get the Cosmos DB container, initializing if necessary
 * @returns The container object
 */
async function getContainer(): Promise<Container> {
  if (!container) {
    await init();
  }
  return container;
}

export { init, getContainer }; 