const { CosmosClient } = require('@azure/cosmos');

// Initialize the Cosmos client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID || 'papercut-db';
const containerId = process.env.COSMOS_CONTAINER_ID || 'suggestions';

const client = new CosmosClient({ endpoint, key });
let database;
let container;

async function init() {
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

module.exports = {
  init,
  getContainer: async () => {
    if (!container) {
      await init();
    }
    return container;
  }
};