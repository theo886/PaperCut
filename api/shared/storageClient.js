const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Get connection string from environment variable
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'papercut-uploads';

// Create BlobServiceClient
let blobServiceClient;
let containerClient;

async function getContainerClient() {
    if (!containerClient) {
        if (!connectionString) {
            throw new Error('Azure Storage connection string not found');
        }

        // Create the BlobServiceClient
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Get a reference to the container
        containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Create the container if it doesn't exist
        try {
            await containerClient.createIfNotExists({
                access: 'blob' // Public read access for blobs only
            });
        } catch (error) {
            console.error('Error creating container:', error);
            throw error;
        }
    }
    
    return containerClient;
}

/**
 * Upload a file to Azure Blob Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalFilename - The original file name
 * @param {string} contentType - The file's content type
 * @returns {Promise<{url: string, filename: string}>} - The URL and filename of the uploaded file
 */
async function uploadFile(fileBuffer, originalFilename, contentType) {
    const container = await getContainerClient();
    
    // Generate a unique name for the blob
    const extension = originalFilename.split('.').pop();
    const blobName = `${uuidv4()}.${extension}`;
    
    // Get a block blob client
    const blockBlobClient = container.getBlockBlobClient(blobName);
    
    // Upload the file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
            blobContentType: contentType
        }
    });
    
    // Return the URL and filename
    return {
        url: blockBlobClient.url,
        filename: blobName
    };
}

/**
 * Check if a file is an image
 * @param {string} contentType - The file's content type
 * @returns {boolean} - Whether the file is an image
 */
function isImage(contentType) {
    return contentType.startsWith('image/');
}

module.exports = {
    uploadFile,
    isImage
};