import React from 'react';
import { UserX } from 'lucide-react';
import AnonymousToggle from './AnonymousToggle';

const Header = ({ anonymousMode, toggleAnonymousMode, setView }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          className="text-xl font-bold text-gray-800 cursor-pointer" 
          onClick={() => setView('list')}
        >
          Company Improvement Hub
        </h1>
        <div className="flex items-center space-x-4">
          <AnonymousToggle 
            enabled={anonymousMode} 
            onChange={toggleAnonymousMode} 
          />
          
          {anonymousMode && (
            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs flex items-center">
              <UserX size={14} className="mr-1" /> Anonymous Mode
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
