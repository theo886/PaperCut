const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

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

        // Get storage account info from environment variables
        const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const containerName = process.env.STORAGE_CONTAINER_NAME || "papercut-uploads";
        
        // Alternative: try to use connection string if available
        const connectionString = process.env.STORAGE_CONNECTION_STRING;

        let blobServiceClient;

        // First try connection string if available
        if (connectionString) {
            blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        } 
        // Next try managed identity if storage account name is available
        else if (storageAccountName) {
            const url = `https://${storageAccountName}.blob.core.windows.net`;
            const credential = new DefaultAzureCredential();
            blobServiceClient = new BlobServiceClient(url, credential);
        } 
        // If neither is available, log detailed error
        else {
            context.log.error('Storage configuration details:');
            context.log.error('STORAGE_CONNECTION_STRING: ' + (connectionString ? 'present' : 'missing'));
            context.log.error('AZURE_STORAGE_ACCOUNT_NAME: ' + (storageAccountName ? 'present' : 'missing'));
            
            // For debugging, log all environment variables (be careful with sensitive info)
            context.log.error('Available environment variables:');
            Object.keys(process.env).forEach(key => {
                context.log.error(`${key}: ${key.includes('SECRET') || key.includes('KEY') ? '[REDACTED]' : 'present'}`);
            });
            
            context.res = {
                status: 500,
                body: { message: "Storage configuration missing. Please set STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME environment variable." }
            };
            return;
        }

        // Create container client
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Create unique filename
        const blobName = `${Date.now()}-${fileData.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        try {
            // Create container if it doesn't exist
            await containerClient.createIfNotExists({ access: 'blob' });
        } catch (containerError) {
            context.log.error('Error creating container:', containerError);
            context.res = {
                status: 500,
                body: { message: `Error creating container: ${containerError.message}` }
            };
            return;
        }
        
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

        // Return success response
        context.res = {
            status: 200,
            body: {
                url: url,
                filename: fileData.name,
                contentType: fileData.contentType,
                size: fileData.size,
                isImage: fileData.contentType.startsWith('image/')
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