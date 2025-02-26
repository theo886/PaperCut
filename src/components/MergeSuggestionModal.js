import React, { useState, useEffect } from 'react';
import { X, Loader2, GitMerge } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const MergeSuggestionModal = ({ isOpen, onClose, targetSuggestion, availableSuggestions, onMerge, isLoading }) => {
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Filter out the current suggestion and already merged suggestions
    const filtered = availableSuggestions.filter(suggestion => {
      // Don't include the target suggestion itself
      if (suggestion.id === targetSuggestion?.id) return false;
      
      // Don't include already merged suggestions
      if (suggestion.status === 'Merged') return false;
      
      // Filter by search term if provided
      if (searchTerm) {
        return suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               suggestion.description.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return true;
    });
    
    setFilteredSuggestions(filtered);
  }, [availableSuggestions, targetSuggestion, searchTerm]);
  
  const handleMerge = () => {
    if (!selectedSourceId) return;
    onMerge(targetSuggestion.id, selectedSourceId);
  };
  
  if (!isOpen || !targetSuggestion) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-medium flex items-center">
            <GitMerge size={20} className="mr-2 text-indigo-600" />
            Merge Suggestion
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium mb-2">Target Suggestion (Keep)</h3>
          <div className="bg-white p-3 rounded border">
            <div className="font-medium">{targetSuggestion.title}</div>
            <div className="text-sm text-gray-500 mt-1">
              {targetSuggestion.description.length > 150 
                ? targetSuggestion.description.substring(0, 150) + '...'
                : targetSuggestion.description}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Votes: {targetSuggestion.votes} | Status: {targetSuggestion.status} | Created: {formatDate(targetSuggestion.timestamp)}
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-grow overflow-auto">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Select Suggestion to Merge (Will be marked as merged)</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search suggestions..."
                className="w-full border rounded-md p-2 pl-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 absolute top-2.5 left-2.5 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm 
                  ? "No matching suggestions found" 
                  : "No other suggestions available for merging"}
              </div>
            ) : (
              filteredSuggestions.map(suggestion => (
                <div 
                  key={suggestion.id}
                  className={`border rounded p-3 cursor-pointer transition-colors ${
                    selectedSourceId === suggestion.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedSourceId(suggestion.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="sourceSuggestion"
                      checked={selectedSourceId === suggestion.id}
                      onChange={() => setSelectedSourceId(suggestion.id)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <div className="flex-grow">
                      <div className="font-medium">{suggestion.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {suggestion.description.length > 100 
                          ? suggestion.description.substring(0, 100) + '...'
                          : suggestion.description}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Votes: {suggestion.votes} | Status: {suggestion.status} | Created: {formatDate(suggestion.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 mr-2"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            onClick={handleMerge}
            disabled={!selectedSourceId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Merging...
              </>
            ) : (
              <>
                <GitMerge size={16} className="mr-2" /> Merge Suggestions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeSuggestionModal;