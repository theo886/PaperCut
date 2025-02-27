const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('Processing file upload request');

    try {
        // Get file data from request
        const fileData = req.body.file;
        if (!fileData) {
            context.res = {
                status: 400,
                body: { message: "File data is required" }
            };
            return;
        }

        // Get storage configuration from environment variables
        const connectionString = process.env.STORAGE_CONNECTION_STRING;
        const containerName = process.env.STORAGE_CONTAINER_NAME || "papercut-uploads";

        if (!connectionString) {
            context.log.error('Missing storage connection string');
            context.res = {
                status: 500,
                body: { message: "Storage configuration missing" }
            };
            return;
        }

        // Create unique filename to avoid collisions
        const blobName = `${Date.now()}-${fileData.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Connect to Azure Blob Storage
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Create container if it doesn't exist
        await containerClient.createIfNotExists({ access: 'blob' });
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Convert base64 data to buffer
        const buffer = Buffer.from(fileData.data, 'base64');

        // Upload file
        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: {
                blobContentType: fileData.contentType
            }
        });

        // Get URL to the uploaded file
        const url = blockBlobClient.url;

        // Check if file is an image based on content type
        const isImage = fileData.contentType.startsWith('image/');

        // Return success response with file info
        context.res = {
            status: 200,
            body: {
                url: url,
                filename: fileData.name,
                contentType: fileData.contentType,
                size: fileData.size,
                isImage: isImage
            }
        };
    } catch (error) {
        context.log.error('Error uploading file:', error);
        context.res = {
            status: 500,
            body: { message: `Error uploading file: ${error.message}` }
        };
    }
};