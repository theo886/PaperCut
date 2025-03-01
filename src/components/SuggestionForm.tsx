import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, UserX, Loader2, ChevronDown, Check } from 'lucide-react';
import FileUploader, { AttachmentList } from './FileUploader';
import { SuggestionFormProps, MultiSelectDropdownProps, Suggestion, Attachment } from '../types/index';

// MultiSelectDropdown component inside the same file
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, label }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleOption = (option: string) => {
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
                {value} <X size={14} className="ml-1 cursor-pointer" />
              </div>
            ))}
          </div>
        )}
        <div className="ml-auto">
          <ChevronDown size={18} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          {options.map(option => (
            <div 
              key={option}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => toggleOption(option)}
            >
              <div className={`w-4 h-4 mr-2 flex-shrink-0 border rounded ${selectedValues.includes(option) ? 'bg-indigo-600 border-indigo-600 flex items-center justify-center' : 'border-gray-300'}`}>
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

// SimilarPostsDropdown component
interface SimilarPostsDropdownProps {
  suggestions: Suggestion[];
  searchTerm: string;
  onSuggestionClick: (id: string) => void;
}

const SimilarPostsDropdown: React.FC<SimilarPostsDropdownProps> = ({ suggestions, searchTerm, onSuggestionClick }) => {
  if (!searchTerm || searchTerm.length < 3 || suggestions.length === 0) return null;
  
  const matchingTitle = suggestions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const matchingBody = suggestions.filter(s => 
    !s.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Only show dropdown if we have matches
  if (matchingTitle.length === 0 && matchingBody.length === 0) return null;
  
  return (
    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
      {matchingTitle.length > 0 && (
        <div className="p-2 bg-gray-50 text-sm font-semibold text-gray-500">
          Similar titles:
        </div>
      )}
      
      {matchingTitle.map(suggestion => (
        <div 
          key={suggestion.id}
          className="p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => onSuggestionClick(suggestion.id)}
        >
          <div className="font-medium">{suggestion.title}</div>
          <div className="text-sm text-gray-500 truncate">
            {suggestion.description.substring(0, 80)}...
          </div>
        </div>
      ))}
      
      {matchingBody.length > 0 && (
        <div className="p-2 bg-gray-50 text-sm font-semibold text-gray-500">
          Similar content:
        </div>
      )}
      
      {matchingBody.map(suggestion => (
        <div 
          key={suggestion.id}
          className="p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => onSuggestionClick(suggestion.id)}
        >
          <div className="font-medium">{suggestion.title}</div>
          <div className="text-sm text-gray-500 truncate">
            {suggestion.description.substring(0, 80)}...
          </div>
        </div>
      ))}
    </div>
  );
};

const SuggestionForm: React.FC<SuggestionFormProps> = ({ 
  onSubmit, 
  onCancel, 
  anonymousMode,
  isSubmitting,
  existingSuggestions = [],
  onViewSuggestion
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(anonymousMode);
  const [departments, setDepartments] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showSimilarPosts, setShowSimilarPosts] = useState<boolean>(true);
  
  // Available departments
  const availableDepartments = [
    "Product",
    "Engineering",
    "Customer Success",
    "Sales",
    "Marketing",
    "Operations",
    "HR",
    "Finance",
    "Legal",
    "Other"
  ];
  
  useEffect(() => {
    // Sync anonymous state with prop
    setIsAnonymous(anonymousMode);
  }, [anonymousMode]);
  
  // Remove an attachment
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  // Add a new attachment
  const addAttachment = (fileInfo: Attachment) => {
    setAttachments([...attachments, fileInfo]);
  };
  
  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a title for your suggestion.');
      return;
    }
    
    if (!description.trim()) {
      alert('Please provide a description for your suggestion.');
      return;
    }
    
    onSubmit({ 
      title, 
      description, 
      isAnonymous, 
      attachments,
      departments
    });
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">New Suggestion</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4 relative">
          <label htmlFor="title" className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            id="title"
            className="w-full p-2 border rounded-md"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Write a concise summary of your suggestion"
            required
            disabled={isSubmitting}
          />
          
          {/* Similar posts dropdown */}
          {showSimilarPosts && (
            <SimilarPostsDropdown 
              suggestions={existingSuggestions} 
              searchTerm={title} 
              onSuggestionClick={onViewSuggestion}
            />
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 mb-2">Description</label>
          <textarea
            id="description"
            className="w-full p-2 border rounded-md min-h-[200px]"
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Provide details about your suggestion..."
            required
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div className="mb-4">
          <MultiSelectDropdown 
            options={availableDepartments}
            selectedValues={departments}
            onChange={setDepartments}
            label="Related Departments"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Attachments</label>
          <FileUploader onFileUploaded={addAttachment} disabled={isSubmitting} />
          {attachments.length > 0 && (
            <div className="mt-2">
              <AttachmentList attachments={attachments} onRemove={removeAttachment} />
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
              disabled={isSubmitting}
            />
            <div className={`relative w-11 h-6 bg-gray-200 rounded-full peer ${isAnonymous ? 'bg-indigo-600' : ''}`}>
              <div className={`absolute top-1 left-1 bg-white rounded-full h-4 w-4 transition-all ${isAnonymous ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-3 flex items-center">
              {isAnonymous ? (
                <>
                  <UserX size={18} className="mr-1 text-indigo-600" /> Post anonymously
                </>
              ) : (
                'Post with my name'
              )}
            </span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : 'Submit Suggestion'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuggestionForm; 