import React from 'react';
import { FileText, Image, Film, Music, File, Download } from 'lucide-react';

const Attachment = ({ attachment, className }) => {
  if (!attachment) return null;
  
  // Check if it's an image attachment
  const isImage = attachment.isImage || 
    (attachment.type && attachment.type.startsWith('image/')) ||
    (attachment.url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.url));
  
  if (isImage) {
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
  
  // For non-image attachments
  return (
    <a 
      href={attachment.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100 text-gray-700 text-sm transition-colors"
    >
      <div className="text-gray-500 mr-2">
        <FileText size={16} />
      </div>
      <span className="truncate flex-grow">
        {attachment.name || attachment.filename || attachment.url.split('/').pop()}
      </span>
      <Download size={14} className="text-gray-400 ml-2" />
    </a>
  );
};

export default Attachment; 