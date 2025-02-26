import React, { useState } from 'react';
import { Paperclip, X, FileText, Image, Loader2 } from 'lucide-react';
import apiService from '../services/apiService';

const FileUploader = ({ onFileUploaded, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the maximum limit of 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('File type not allowed. Accepted file types: JPG, PNG, GIF, PDF, DOC, DOCX, TXT');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Upload the file
      const result = await apiService.uploadFile(file);
      
      // Call the callback with the uploaded file info
      onFileUploaded(result);
      
      // Reset the input
      e.target.value = null;
    } catch (error) {
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
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
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

// The component to display a list of attached files
export const AttachmentList = ({ attachments, onRemove }) => {
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

// The component to display a single attachment
export const Attachment = ({ attachment, className }) => {
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

export default FileUploader;