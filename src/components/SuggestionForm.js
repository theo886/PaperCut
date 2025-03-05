import React, { useState, useRef, useEffect } from 'react';
import { X, UserX, Loader2, ChevronDown, Check } from 'lucide-react';
import FileUploader, { AttachmentList } from './FileUploader';

// MultiSelectDropdown component inside the same file
const MultiSelectDropdown = ({ options, selectedValues, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleOption = (option) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(value => value !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-gray-700 mb-2">{label}</label>
      <div
        className="border rounded-md p-2 flex flex-wrap items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 ? (
          <span className="text-gray-500">Select departments...</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map(value => (
              <div 
                key={value} 
                className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(value);
                }}
              >
                {value}
                <X size={14} className="ml-1 cursor-pointer" />
              </div>
            ))}
          </div>
        )}
        <ChevronDown size={16} className="ml-auto" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div 
              key={option}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => toggleOption(option)}
            >
              <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${selectedValues.includes(option) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {selectedValues.includes(option) && <Check size={12} className="text-white" />}
              </div>
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// SimilarPostsDropdown component inside the same file
const SimilarPostsDropdown = ({ suggestions, searchTerm, onSuggestionClick }) => {
  if (!searchTerm || searchTerm.length < 2) return null;

  // Filter suggestions based on the current search term (last word typed)
  const words = searchTerm.trim().split(/\s+/);
  const currentWord = words[words.length - 1].toLowerCase();
  
  // Only filter if the current word has at least 2 characters
  if (currentWord.length < 2) return null;
  
  const matchingSuggestions = suggestions.filter(suggestion => 
    suggestion.title.toLowerCase().includes(currentWord)
  );
  
  if (matchingSuggestions.length === 0) return null;
  
  return (
    <div className="mt-1 mb-4">
      <h4 className="text-sm text-gray-600 mb-2">Posts that may already contain your suggestion</h4>
      <div className="border rounded-md overflow-hidden">
        {matchingSuggestions.map(suggestion => (
          <div 
            key={suggestion.id}
            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            onClick={() => onSuggestionClick(suggestion.id)}
          >
            <span className="text-indigo-600">{suggestion.title}</span> #{suggestion.id}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main SuggestionForm component with updates
const SuggestionForm = ({ 
  onSubmit, 
  onCancel, 
  anonymousMode, 
  isSubmitting,
  existingSuggestions = [],
  onViewSuggestion
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      const suggestionData = {
        title: title.trim(),
        description: description.trim(),
        isAnonymous: submitAnonymously,
        attachments: attachments,
        departments: departments
      };
      onSubmit(suggestionData);
    }
  };
  
  const handleFileUploaded = (fileInfo) => {
    setAttachments([...attachments, fileInfo]);
  };
  
  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const addComment = async (suggestionId, commentData) => {
    const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });

    const data = await response.json();
    console.log('apiService: Received comment response from backend:', data);
    return data;
  };
  
  return (
    <div className="max-w-xl mx-auto mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Make a suggestion</h2>
          //<button 
            //onClick={onCancel}
            //</div>className="text-gray-500 hover:text-gray-700"
            //</div>disabled={isSubmitting}
         //</div> >
            //<X size={20} />
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
          </div>
          
          <SimilarPostsDropdown 
            suggestions={existingSuggestions}
            searchTerm={searchTerm}
            onSuggestionClick={onViewSuggestion}
          />
          
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