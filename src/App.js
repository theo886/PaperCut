import React, { useState, useEffect, useContext } from 'react';
import Header from './components/Header';
import SuggestionCard from './components/SuggestionCard';
import SuggestionDetail from './components/SuggestionDetail';
import SuggestionForm from './components/SuggestionForm';
import { initialSuggestions } from './data';
import { ChevronUp, Clock } from 'lucide-react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/Login';

// Main App component with authentication
function AppContent() {
  const [view, setView] = useState('list'); // 'list', 'detail', 'create'
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'votes'
  
  const { user, loading } = useContext(AuthContext);
  
  // Local storage for persistence
  useEffect(() => {
    const storedSuggestions = localStorage.getItem('suggestions');
    if (storedSuggestions) {
      setSuggestions(JSON.parse(storedSuggestions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  // If still loading authentication, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!user) {
    return <Login />;
  }

  // User info - now coming from authenticated user
  const userInfo = {
    id: user.userId,
    name: user.userDetails,
    initial: user.userDetails ? user.userDetails.charAt(0).toUpperCase() : 'U',
    isAdmin: user.roles?.includes('admin') || false
  };

  // Navigate to suggestion detail view
  const viewSuggestion = (id) => {
    const suggestion = suggestions.find(s => s.id === id);
    setSelectedSuggestion(suggestion);
    setView('detail');
  };

  // Vote for a suggestion
  const voteSuggestion = (id) => {
    setSuggestions(suggestions.map(s => {
      if (s.id === id) {
        return { ...s, votes: s.votes + 1 };
      }
      return s;
    }));
  };

  // Add a comment to a suggestion
  const addComment = (id, text, isAnonymous) => {
    const updatedSuggestions = suggestions.map(s => {
      if (s.id === id) {
        const newComment = {
          id: s.comments.length + 1,
          author: isAnonymous ? "Anonymous" : userInfo.name,
          authorInitial: isAnonymous ? "?" : userInfo.initial,
          authorId: isAnonymous ? null : userInfo.id,
          isAnonymous: isAnonymous,
          text,
          timestamp: 'just now',
          likes: 0
        };
        return { ...s, comments: [...s.comments, newComment] };
      }
      return s;
    });
    
    setSuggestions(updatedSuggestions);
    
    // Update selectedSuggestion if it's the one being commented on
    if (selectedSuggestion && selectedSuggestion.id === id) {
      const updatedSuggestion = updatedSuggestions.find(s => s.id === id);
      setSelectedSuggestion(updatedSuggestion);
    }
  };

  // Update suggestion status (admin action)
  const updateStatus = (id, status) => {
    setSuggestions(suggestions.map(s => {
      if (s.id === id) {
        const newActivity = {
          id: s.activity.length + 1,
          type: 'status',
          from: s.status,
          to: status,
          timestamp: 'just now',
          author: userInfo.name,
          authorInitial: userInfo.initial
        };
        return { 
          ...s, 
          status, 
          activity: [...s.activity, newActivity] 
        };
      }
      return s;
    }));
  };

  // Update effort/impact scores (admin action)
  const updateScores = (id, effortScore, impactScore) => {
    setSuggestions(suggestions.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          effortScore, 
          impactScore,
          priorityScore: (6 - effortScore) * impactScore // Inverse effort (lower is better) times impact
        };
      }
      return s;
    }));
  };

  // Create a new suggestion
  const createSuggestion = (title, description, visibility, isAnonymous) => {
    const newSuggestion = {
      id: Date.now(), // Use timestamp as ID
      title,
      description,
      author: isAnonymous ? "Anonymous" : userInfo.name,
      authorInitial: isAnonymous ? "?" : userInfo.initial,
      authorId: isAnonymous ? null : userInfo.id,
      isAnonymous: isAnonymous,
      status: 'New',
      departments: [],
      votes: 0,
      comments: [],
      activity: [],
      timestamp: 'just now',
      visibility,
      effortScore: 0,
      impactScore: 0,
      priorityScore: 0,
      mergedWith: []
    };
    
    setSuggestions([newSuggestion, ...suggestions]);
    setView('list');
  };

  // Toggle anonymous mode
  const toggleAnonymousMode = () => {
    setAnonymousMode(!anonymousMode);
  };

  // Sort suggestions
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    }
    // Default to newest (by id, which is a timestamp)
    return b.id - a.id;
  });

  // Render different views based on state
  switch (view) {
    case 'detail':
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={anonymousMode}
            toggleAnonymousMode={toggleAnonymousMode}
            setView={setView}
            user={userInfo}
          />
          {selectedSuggestion && (
            <SuggestionDetail 
              suggestion={selectedSuggestion}
              isAdmin={userInfo.isAdmin}
              anonymousMode={anonymousMode}
              onBack={() => setView('list')}
              onAddComment={(text, isAnonymous) => addComment(selectedSuggestion.id, text, isAnonymous)}
              onUpdateStatus={(status) => updateStatus(selectedSuggestion.id, status)}
              onUpdateScores={(effort, impact) => updateScores(selectedSuggestion.id, effort, impact)}
            />
          )}
        </div>
      );
    case 'create':
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={anonymousMode}
            toggleAnonymousMode={toggleAnonymousMode}
            setView={setView}
            user={userInfo}
          />
          <SuggestionForm 
            onSubmit={createSuggestion}
            onCancel={() => setView('list')}
            anonymousMode={anonymousMode}
          />
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={anonymousMode}
            toggleAnonymousMode={toggleAnonymousMode}
            setView={setView}
            user={userInfo}
          />
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Improvement Ideas</h1>
                <p className="text-gray-600">Vote on existing ideas or suggest new ones.</p>
              </div>
              <button 
                onClick={() => setView('create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                Make a suggestion
              </button>
            </div>
            
            <div className="flex gap-4 mb-4 text-sm">
              <button 
                className={`flex items-center pb-1 ${sortBy === 'newest' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setSortBy('newest')}
              >
                <Clock size={16} className="mr-1" /> Newest
              </button>
              <button 
                className={`flex items-center pb-1 ${sortBy === 'votes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setSortBy('votes')}
              >
                <ChevronUp size={16} className="mr-1" /> Most voted
              </button>
            </div>
            
            <div className="space-y-4">
              {sortedSuggestions.map(suggestion => (
                <SuggestionCard 
                  key={suggestion.id}
                  suggestion={suggestion}
                  onClick={() => viewSuggestion(suggestion.id)}
                  onVote={() => voteSuggestion(suggestion.id)}
                />
              ))}
              
              {sortedSuggestions.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500">No suggestions yet. Be the first to share an idea!</p>
                  <button 
                    onClick={() => setView('create')}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Make a suggestion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
  }
}

// Wrap the app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
