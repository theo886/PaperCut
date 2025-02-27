import React, { useState } from 'react';
import { X, UserX, Loader2 } from 'lucide-react';
import FileUploader, { AttachmentList } from './FileUploader';
import MultiSelectDropdown from './MultiSelectDropdown';
import SimilarPostsDropdown from './SimilarPostsDropdown';

const SuggestionForm = ({ 
  onSubmit, 
  onCancel, 
  anonymousMode, 
  isSubmitting,
  existingSuggestions = [], // Add this prop
  onViewSuggestion // Add this prop
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Visibility feature removed
  const [submitAnonymously, setSubmitAnonymously] = useState(anonymousMode);
  const [attachments, setAttachments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const departmentOptions = [
    'Accounting',
    'Admin',
    'CTT',
    'EHS',
    'Engineering',
    'Facilities',
    'Finance',
    'HR',
    'IT',
    'Legal',
    'Manufacturing',
    'PM',
    'Purchasing',
    'Sales'
  ];
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && description.trim() && !isSubmitting) {
      onSubmit(title, description, submitAnonymously, attachments, departments);
    }
  };
  
  const handleFileUploaded = (fileInfo) => {
    setAttachments([...attachments, fileInfo]);
  };
  
  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Make a suggestion</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Title</label>
            <input 
              type="text" 
              className="w-full border rounded-md p-2"
              placeholder="A short, descriptive title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSearchTerm(e.target.value);
              }}
              required
              disabled={isSubmitting}
            />
            <SimilarPostsDropdown 
              suggestions={existingSuggestions}
              searchTerm={searchTerm}
              onSuggestionClick={onViewSuggestion}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Details</label>
            <textarea 
              className="w-full border rounded-md p-2"
              rows="5"
              placeholder="Please include only one suggestion per post"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isSubmitting}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <MultiSelectDropdown
              options={departmentOptions}
              selectedValues={departments}
              onChange={setDepartments}
              label="Departments"
            />
          </div>
          
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="anonymousSubmit" 
                checked={submitAnonymously}
                onChange={() => setSubmitAnonymously(!submitAnonymously)}
                className="mr-2"
                disabled={isSubmitting}
              />
              <label htmlFor="anonymousSubmit" className="text-sm text-gray-600 flex items-center">
                <UserX size={16} className="mr-1" /> Submit anonymously
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="button"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 mr-2"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              disabled={!title.trim() || !description.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                'Create post'
              )}
            </button>
          </div>
          
          <FileUploader 
            onFileUploaded={handleFileUploaded} 
            disabled={isSubmitting}
          />
          
          <AttachmentList 
            attachments={attachments} 
            onRemove={handleRemoveAttachment}
          />
        </form>
      </div>
    </div>
  );
};

export default SuggestionForm;
