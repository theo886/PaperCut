import React from 'react';
import { ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const SuggestionCard = ({ suggestion, onClick, onVote }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="p-4">
        <div className="flex justify-between">
          <h3 
            className="font-medium text-lg cursor-pointer hover:text-indigo-600" 
            onClick={onClick}
          >
            {suggestion.title}
          </h3>
          <div className="flex items-center space-x-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onVote();
              }}
              className="text-gray-400 hover:text-indigo-600 px-2 py-1 rounded-md flex items-center"
            >
              <ChevronUp size={18} /> {suggestion.votes}
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
          {suggestion.description}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          {suggestion.status === 'New' && (
            <span className="text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded-full text-xs">
              <span className="h-2 w-2 bg-blue-600 rounded-full mr-1"></span> New
            </span>
          )}
          {suggestion.status === 'In Progress' && (
            <span className="text-yellow-600 flex items-center bg-yellow-50 px-2 py-1 rounded-full text-xs">
              <span className="h-2 w-2 bg-yellow-600 rounded-full mr-1"></span> In Progress
            </span>
          )}
          {suggestion.status === 'Under Review' && (
            <span className="text-orange-600 flex items-center bg-orange-50 px-2 py-1 rounded-full text-xs">
              <span className="h-2 w-2 bg-orange-600 rounded-full mr-1"></span> Under Review
            </span>
          )}
          {suggestion.status === 'Implemented' && (
            <span className="text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full text-xs">
              <span className="h-2 w-2 bg-green-600 rounded-full mr-1"></span> Implemented
            </span>
          )}
          {suggestion.status === 'Declined' && (
            <span className="text-red-600 flex items-center bg-red-50 px-2 py-1 rounded-full text-xs">
              <span className="h-2 w-2 bg-red-600 rounded-full mr-1"></span> Declined
            </span>
          )}
          
          {suggestion.departments && suggestion.departments.map(dept => (
            <span key={dept} className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
              {dept}
            </span>
          ))}
          
          <div className="flex items-center text-gray-500 text-xs ml-auto">
            <div className={`h-6 w-6 min-w-6 ${suggestion.isAnonymous ? 'bg-gray-400' : 'bg-purple-500'} rounded-full flex items-center justify-center text-white mr-2 text-xs`}>
              {suggestion.authorInitial}
            </div>
            <span>{formatDate(suggestion.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;
