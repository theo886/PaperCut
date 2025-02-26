const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

const fs = require('fs');
const path = require('path');

// Get connection string from environment variable
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'papercut-uploads';

// For development fallback
const isDevelopment = process.env.NODE_ENV !== 'production';
const localUploadDir = path.join(__dirname, '..', '..', 'uploads');

// Create BlobServiceClient
let blobServiceClient;
let containerClient;

// Ensure local upload directory exists for dev fallback
if (isDevelopment && !connectionString) {
    try {
        if (!fs.existsSync(localUploadDir)) {
            fs.mkdirSync(localUploadDir, { recursive: true });
            console.log(`Created local upload directory: ${localUploadDir}`);
        }
    } catch (error) {
        console.error('Error creating local upload directory:', error);
    }
}

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
    try {
        console.log(`Starting upload for file: ${originalFilename}, size: ${fileBuffer.length} bytes, type: ${contentType}`);
        
        // Generate a unique name for the file
        const extension = originalFilename.split('.').pop() || 'bin';
        const fileName = `${uuidv4()}.${extension}`;
        
        // Check if Azure storage is configured
        if (connectionString) {
            console.log('Using Azure Blob Storage');
            const container = await getContainerClient();
            
            // Get a block blob client
            const blockBlobClient = container.getBlockBlobClient(fileName);
            
            // Upload the file
            console.log('Starting blob upload...');
            const uploadOptions = {
                blobHTTPHeaders: {
                    blobContentType: contentType
                }
            };
            
            const uploadResult = await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);
            console.log('Upload complete:', uploadResult);
            
            // Return the URL and filename
            return {
                url: blockBlobClient.url,
                filename: fileName,
                isImage: isImage(contentType)
            };
        } 
        // Fallback to local storage for development
        else if (isDevelopment) {
            console.log('Azure Storage not configured. Using local file system for development.');
            
            // Save file to local uploads directory
            const filePath = path.join(localUploadDir, fileName);
            fs.writeFileSync(filePath, fileBuffer);
            console.log(`File saved locally to: ${filePath}`);
            
            // For local development, create a URL that the frontend can access
            const localUrl = `/uploads/${fileName}`;
            
            return {
                url: localUrl,
                filename: fileName,
                isImage: isImage(contentType),
                local: true
            };
        }
        else {
            throw new Error('Storage connection string not configured and not in development mode');
        }
    } catch (error) {
        console.error('Error in uploadFile:', error);
        // Add more context to the error
        if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
            throw new Error(`Cannot connect to Azure Storage. Please verify network connectivity and storage account settings. Original error: ${error.message}`);
        } else if (error.message.includes('AuthenticationFailed')) {
            throw new Error(`Azure Storage authentication failed. Please check the storage account credentials. Original error: ${error.message}`);
        } else {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }
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