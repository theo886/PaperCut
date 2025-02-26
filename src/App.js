import React, { useState, useEffect, useContext } from 'react';
import Header from './components/Header';
import SuggestionCard from './components/SuggestionCard';
import SuggestionDetail from './components/SuggestionDetail';
import SuggestionForm from './components/SuggestionForm';
import { initialSuggestions } from './data'; // Fallback data
import { ChevronUp, Clock } from 'lucide-react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import apiService from './services/apiService';
import { formatUserName } from './utils/formatters';

// Main App component with authentication
function AppContent() {
  const [view, setView] = useState('list'); // 'list', 'detail', 'create'
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [anonymousMode] = useState(false); // We're no longer toggling anonymousMode from header
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'votes'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // Fetch suggestions from the API
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions. Please try again later.');
      // Fall back to local storage or initial data if API fails
      const storedSuggestions = localStorage.getItem('suggestions');
      if (storedSuggestions) {
        setSuggestions(JSON.parse(storedSuggestions));
      } else {
        setSuggestions(initialSuggestions);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // We don't need to fetch all suggestions separately as we're
  // using the already loaded suggestions list for the merge functionality
  
  // Load suggestions on initial render
  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  // If still loading authentication, show loading state
  if (authLoading) {
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
  const formattedName = formatUserName(user.userDetails);
  const userInfo = {
    id: user.userId,
    name: formattedName,
    initial: formattedName ? formattedName.charAt(0).toUpperCase() : 'U',
    isAdmin: user.roles?.includes('admin') || false
  };

  // Navigate to suggestion detail view
  const viewSuggestion = async (id) => {
    try {
      setLoading(true);
      const suggestion = await apiService.getSuggestionById(id);
      setSelectedSuggestion(suggestion);
      setView('detail');
    } catch (error) {
      console.error(`Error fetching suggestion ${id}:`, error);
      setError(`Failed to load suggestion details. Please try again later.`);
      // Fall back to client-side data
      const suggestion = suggestions.find(s => s.id === id);
      if (suggestion) {
        setSelectedSuggestion(suggestion);
        setView('detail');
      }
    } finally {
      setLoading(false);
    }
  };

  // Vote for a suggestion
  const voteSuggestion = async (id) => {
    try {
      setLoading(true);
      const response = await apiService.voteSuggestion(id);
      
      // Update the suggestions list with the new vote count
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return { ...s, votes: response.votes };
        }
        return s;
      }));
      
      // Update selected suggestion if it's the one being voted on
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion({ ...selectedSuggestion, votes: response.votes });
      }
    } catch (error) {
      console.error(`Error voting for suggestion ${id}:`, error);
      alert('Failed to register your vote. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add a comment to a suggestion
  const addComment = async (id, text, isAnonymous) => {
    try {
      setLoading(true);
      const commentData = { text, isAnonymous };
      const newComment = await apiService.addComment(id, commentData);
      
      // Update the suggestions list with the new comment
      const updatedSuggestions = suggestions.map(s => {
        if (s.id === id) {
          return { ...s, comments: [...s.comments, newComment] };
        }
        return s;
      });
      
      setSuggestions(updatedSuggestions);
      
      // Update selectedSuggestion if it's the one being commented on
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion({ 
          ...selectedSuggestion, 
          comments: [...selectedSuggestion.comments, newComment] 
        });
      }
    } catch (error) {
      console.error(`Error adding comment to suggestion ${id}:`, error);
      alert('Failed to add your comment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Update suggestion status (admin action)
  const updateStatus = async (id, status) => {
    try {
      setLoading(true);
      const updatedData = { status };
      const updatedSuggestion = await apiService.updateSuggestion(id, updatedData);
      
      // Update the suggestions list with the updated suggestion
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return updatedSuggestion;
        }
        return s;
      }));
      
      // Update selectedSuggestion if it's the one being updated
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion(updatedSuggestion);
      }
    } catch (error) {
      console.error(`Error updating status for suggestion ${id}:`, error);
      alert('Failed to update status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Update effort/impact scores (admin action)
  const updateScores = async (id, effortScore, impactScore) => {
    try {
      setLoading(true);
      const updatedData = { effortScore, impactScore };
      const updatedSuggestion = await apiService.updateSuggestion(id, updatedData);
      
      // Update the suggestions list with the updated suggestion
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return updatedSuggestion;
        }
        return s;
      }));
      
      // Update selectedSuggestion if it's the one being updated
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion(updatedSuggestion);
      }
    } catch (error) {
      console.error(`Error updating scores for suggestion ${id}:`, error);
      alert('Failed to update scores. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Merge suggestions (admin action)
  const mergeSuggestions = async (targetId, sourceId) => {
    try {
      setLoading(true);
      
      const result = await apiService.mergeSuggestions(targetId, sourceId);
      
      // Update suggestions list
      setSuggestions(suggestions.map(s => {
        if (s.id === targetId) {
          return result.target;
        }
        if (s.id === sourceId) {
          return result.source;
        }
        return s;
      }));
      
      // Update selected suggestion if it's the target
      if (selectedSuggestion && selectedSuggestion.id === targetId) {
        setSelectedSuggestion(result.target);
      }
      
      alert('Suggestions merged successfully');
      return result;
    } catch (error) {
      console.error(`Error merging suggestions:`, error);
      alert('Failed to merge suggestions. Please try again later.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create a new suggestion
  const createSuggestion = async (title, description, isAnonymous) => {
    try {
      setLoading(true);
      const suggestionData = {
        title,
        description,
        isAnonymous
      };
      
      const newSuggestion = await apiService.createSuggestion(suggestionData);
      
      // Add the new suggestion to the list
      setSuggestions([newSuggestion, ...suggestions]);
      setView('list');
    } catch (error) {
      console.error('Error creating suggestion:', error);
      alert('Failed to create suggestion. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Anonymous mode is now controlled at the component level

  // Sort suggestions
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    }
    // Convert string timestamps to Date objects for proper comparison
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA;
  });

  // Render different views based on state
  switch (view) {
    case 'detail':
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={false}
            toggleAnonymousMode={() => {}}
            setView={setView}
            user={userInfo}
          />
          {loading ? (
            <div className="max-w-4xl mx-auto p-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p>Loading suggestion details...</p>
            </div>
          ) : error ? (
            <div className="max-w-4xl mx-auto p-4 text-center">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => setView('list')}
                className="mt-4 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Go back
              </button>
            </div>
          ) : selectedSuggestion && (
            <SuggestionDetail 
              suggestion={selectedSuggestion}
              isAdmin={userInfo.isAdmin}
              anonymousMode={anonymousMode}
              onBack={() => setView('list')}
              onAddComment={(text, isAnonymous) => addComment(selectedSuggestion.id, text, isAnonymous)}
              onUpdateStatus={(status) => updateStatus(selectedSuggestion.id, status)}
              onUpdateScores={(effort, impact) => updateScores(selectedSuggestion.id, effort, impact)}
              onMergeSuggestions={mergeSuggestions}
              allSuggestions={suggestions}
            />
          )}
        </div>
      );
    case 'create':
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={false}
            toggleAnonymousMode={() => {}}
            setView={setView}
            user={userInfo}
          />
          <SuggestionForm 
            onSubmit={createSuggestion}
            onCancel={() => setView('list')}
            anonymousMode={anonymousMode}
            isSubmitting={loading}
          />
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={false}
            toggleAnonymousMode={() => {}}
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
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p>Loading suggestions...</p>
              </div>
            )}
            
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
                <p>{error}</p>
                <button 
                  onClick={fetchSuggestions}
                  className="mt-2 text-sm font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
            
            {!loading && !error && (
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
            )}
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
