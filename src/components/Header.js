import React, { useContext, useState } from 'react';
import { ChevronDown, LogOut, PieChart } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const Header = ({ anonymousMode, toggleAnonymousMode, setView, user, showDashboard }) => {
  const { logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 
            className="text-3xl font-bold text-gray-800 cursor-pointer" 
            onClick={() => setView('list')}
          >
            Project Paper Cut
          </h1>
          
          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setView('list')}
              className="text-gray-600 hover:text-gray-900"
            >
              Suggestions
            </button>
            
            {showDashboard && (
              <button
                onClick={() => setView('dashboard')}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <PieChart size={16} className="mr-1" />
                Dashboard
              </button>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center text-sm rounded-full focus:outline-none"
            >
              <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center text-white mr-2">
                {user ? user.initial : 'U'}
              </div>
              <span className="hidden md:inline-block mr-1">{user ? user.name : 'User'}</span>
              <ChevronDown size={16} />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
