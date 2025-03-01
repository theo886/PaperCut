import React, { useState, ChangeEvent } from 'react';
import { Paperclip, X, FileText, Image, Loader2 } from 'lucide-react';
import apiService from '../services/apiService';
import { Attachment as AttachmentType, FileUploaderProps } from '../types/index';

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded, disabled = false }) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the maximum limit of 20MB');
      return;
    }
    
    // File type validation removed - all types are now allowed
    
    try {
      setUploading(true);
      setError(null);
      
      // Upload the file
      const result = await apiService.uploadFile(file);
      
      // Call the callback with the uploaded file info
      onFileUploaded(result);
      
      // Reset the input
      e.target.value = '';
    } catch (error: any) {
      setError(error.message || 'Error uploading file');
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="mt-2">
      <label 
        className={`inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Paperclip size={16} className="mr-2" />
            Attach file
          </>
        )}
        <input 
          type="file" 
          className="hidden"
          onChange={handleFileChange}
          accept="*"
          disabled={disabled || uploading}
        />
      </label>
      
      {error && (
        <div className="text-red-500 text-xs mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

interface AttachmentListProps {
  attachments: AttachmentType[];
  onRemove?: (index: number) => void;
}

// The component to display a list of attached files
export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, onRemove }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-2">
      <h4 className="text-sm text-gray-500">Attachments</h4>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div key={index} className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-sm">
            {attachment.isImage ? (
              <Image size={14} className="mr-1 text-gray-500" />
            ) : (
              <FileText size={14} className="mr-1 text-gray-500" />
            )}
            <span className="truncate max-w-[150px]">
              {attachment.filename || attachment.url.split('/').pop()}
            </span>
            {onRemove && (
              <button 
                onClick={() => onRemove(index)} 
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface AttachmentComponentProps {
  attachment: AttachmentType;
  className?: string;
}

// The component to display a single attachment
export const AttachmentComponent: React.FC<AttachmentComponentProps> = ({ attachment, className }) => {
  if (!attachment) return null;
  
  if (attachment.isImage) {
    return (
      <div className={`mt-2 ${className || ''}`}>
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            src={attachment.url} 
            alt="Attachment" 
            className="max-h-64 rounded-md border border-gray-200"
          />
        </a>
      </div>
    );
  }
  
  return (
    <div className={`mt-2 ${className || ''}`}>
      <a 
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
      >
        <FileText size={16} className="mr-1" />
        View attached file
      </a>
    </div>
  );
};

// Export the type for use elsewhere
export type { AttachmentType as Attachment };

export default FileUploader; 