import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Get connection string from environment variable
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'papercut-uploads';

// For development fallback
const isDevelopment = process.env.NODE_ENV !== 'production';
const localUploadDir = path.join(__dirname, '..', '..', 'uploads');

// Create BlobServiceClient
let blobServiceClient: BlobServiceClient;
let containerClient: ContainerClient;

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

/**
 * Get a reference to the Azure Storage container client
 * @returns The container client
 */
async function getContainerClient(): Promise<ContainerClient> {
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

interface UploadResult {
  url: string;
  filename: string;
  isImage: boolean;
  local?: boolean;
}

/**
 * Upload a file to Azure Blob Storage
 * @param fileBuffer - The file buffer to upload
 * @param originalFilename - The original file name
 * @param contentType - The file's content type
 * @returns The URL and filename of the uploaded file
 */
async function uploadFile(
  fileBuffer: Buffer, 
  originalFilename: string, 
  contentType: string
): Promise<UploadResult> {
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
  } catch (error: any) {
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
 * @param contentType - The file's content type
 * @returns Whether the file is an image
 */
function isImage(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export { uploadFile, isImage }; 