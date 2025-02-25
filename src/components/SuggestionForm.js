import React, { useState } from 'react';
import { X, Eye, UserX } from 'lucide-react';

const SuggestionForm = ({ onSubmit, onCancel, anonymousMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [submitAnonymously, setSubmitAnonymously] = useState(anonymousMode);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onSubmit(title, description, visibility, submitAnonymously);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Make a suggestion</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
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
              onChange={(e) => setTitle(e.target.value)}
              required
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
            ></textarea>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center">
              <Eye size={16} className="text-gray-400 mr-2" />
              <select
                className="border rounded-md p-1 text-sm"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="anonymousSubmit" 
                checked={submitAnonymously}
                onChange={() => setSubmitAnonymously(!submitAnonymously)}
                className="mr-2"
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
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              disabled={!title.trim() || !description.trim()}
            >
              Create post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestionForm;
