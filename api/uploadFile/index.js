const { uploadFile, isImage } = require('../shared/storageClient');

module.exports = async function (context, req) {
    try {
        // Get the current user information from the request
        const clientPrincipal = req.headers['x-ms-client-principal']
            ? JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString('ascii'))
            : null;

        if (!clientPrincipal) {
            context.res = {
                status: 401,
                body: { message: "Authentication required" }
            };
            return;
        }

        // Check if the request contains a file
        if (!req.body || !req.body.file) {
            context.res = {
                status: 400,
                body: { message: "No file provided" }
            };
            return;
        }

        const file = req.body.file;
        
        // Check file size (limit to 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            context.res = {
                status: 400,
                body: { message: "File size exceeds the 5MB limit" }
            };
            return;
        }

        // Verify file type (only accept images and common document types)
        const allowedTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (!allowedTypes.includes(file.contentType)) {
            context.res = {
                status: 400,
                body: { message: "File type not allowed. Accepted file types: JPG, PNG, GIF, PDF, DOC, DOCX, TXT" }
            };
            return;
        }

        // Convert base64 to buffer
        const fileBuffer = Buffer.from(file.data, 'base64');
        
        // Upload the file to Azure Blob Storage
        const result = await uploadFile(fileBuffer, file.name, file.contentType);
        
        // Add information about the file type
        result.isImage = isImage(file.contentType);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: result
        };
    } catch (error) {
        context.log.error('Error uploading file:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error uploading file', error: error.message }
        };
    }
};