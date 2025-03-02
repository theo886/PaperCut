import React, { useState, useEffect, useContext } from 'react';
import Header from './components/Header';
import SuggestionCard from './components/SuggestionCard';
import SuggestionDetail from './components/SuggestionDetail';
import SuggestionForm from './components/SuggestionForm';
import Dashboard from './components/Dashboard';
import { initialSuggestions } from './data'; // Fallback data
import { ChevronUp, Clock, PieChart } from 'lucide-react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import apiService from './services/apiService';
import { formatUserName } from './utils/formatters';
import adminEmails from './adminEmails';
import { 
  User, 
  Suggestion, 
  Comment, 
  Attachment, 
  SuggestionFormData, 
  AuthContextType,
  HeaderProps,
  SuggestionDetailProps
} from './types/index';

// Define user info type
interface UserInfo {
  id: string;
  name: string;
  initial: string;
  isAdmin: boolean;
}

interface MergeResponse {
  target: Suggestion;
  source: Suggestion;
}

// Define response type for vote suggestion
interface VoteSuggestionResponse {
  votes: number;
  hasVoted: boolean;
}

// Main App component with authentication
const AppContent: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'dashboard'>('list');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [anonymousMode] = useState<boolean>(false); // We're no longer toggling anonymousMode from header
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useContext(AuthContext) as AuthContextType;
  
  // Fetch suggestions from the API
  const fetchSuggestions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSuggestions();
      setSuggestions(data);
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions. Please try again later.');
      // Fall back to local storage or initial data if API fails
      const storedSuggestions = localStorage.getItem('suggestions');
      if (storedSuggestions) {
        setSuggestions(JSON.parse(storedSuggestions) as Suggestion[]);
      } else {
        setSuggestions(initialSuggestions as unknown as Suggestion[]);
      }
    } finally {
      setLoading(false);
    }
  };
  
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

  // Get user's display name - now from the claims-extracted fullName or fallback to NameMissing
  const displayName = user.fullName || "NameMissing";
  console.log("Using display name:", displayName, "from user:", user);
  
  // Check if user email is in the admin list
  const isAdmin = user && user.userDetails && 
    adminEmails.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );

  const userInfo: UserInfo = {
    id: user.userId,
    name: displayName,
    initial: user.firstName ? user.firstName.charAt(0).toUpperCase() : (displayName ? displayName.charAt(0).toUpperCase() : 'U'),
    isAdmin: Boolean(isAdmin)
  };

  // Navigate to suggestion detail view
  const viewSuggestion = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const suggestion = await apiService.getSuggestionById(id);
      setSelectedSuggestion(suggestion);
      setView('detail');
    } catch (error: any) {
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

  // Vote for a suggestion (toggle function)
  const voteSuggestion = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.voteSuggestion(id) as VoteSuggestionResponse;
      
      // Update the suggestions list with the new vote count and voter state
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return { 
            ...s, 
            votes: response.votes,
            hasVoted: response.hasVoted
          };
        }
        return s;
      }));
      
      // Update selected suggestion if it's the one being voted on
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion({ 
          ...selectedSuggestion, 
          votes: response.votes,
          hasVoted: response.hasVoted
        });
      }
    } catch (error: any) {
      console.error(`Error toggling vote for suggestion ${id}:`, error);
      alert('Failed to register your vote. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add a comment to a suggestion
  const addComment = async (id: string, text: string, isAnonymous: boolean, attachments: Attachment[] = []): Promise<void> => {
    try {
      // Find the current suggestion
      const suggestion = suggestions.find(s => s.id === id);
      
      // Check if the suggestion is locked
      if (suggestion && suggestion.isLocked) {
        alert('This suggestion is locked and cannot receive new comments.');
        return;
      }
      
      setLoading(true);
      const commentData = { text, isAnonymous, attachments };
      const updatedSuggestion = await apiService.addComment(id, commentData);
      
      // Update the suggestions list with the new comment
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return updatedSuggestion;
        }
        return s;
      }));
      
      // Update selected suggestion if it's the one being commented on
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion(updatedSuggestion);
      }
    } catch (error: any) {
      console.error(`Error adding comment to suggestion ${id}:`, error);
      alert('Failed to add your comment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Update suggestion status (admin action)
  const updateStatus = async (id: string, status: string): Promise<void> => {
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
      
      // Update selected suggestion if it's the one being updated
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion(updatedSuggestion);
      }
    } catch (error: any) {
      console.error(`Error updating status for suggestion ${id}:`, error);
      alert('Failed to update suggestion status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update suggestion scores (admin action)
  const updateScores = async (id: string, effortScore: number, impactScore: number): Promise<void> => {
    try {
      setLoading(true);
      const priorityScore = (6 - effortScore) * impactScore; // Calculate priority
      const updatedData = { 
        effortScore, 
        impactScore, 
        priorityScore 
      };
      
      const updatedSuggestion = await apiService.updateSuggestion(id, updatedData);
      
      // Update the suggestions list with the updated suggestion
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return updatedSuggestion;
        }
        return s;
      }));
      
      // Update selected suggestion if it's the one being updated
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion(updatedSuggestion);
      }
    } catch (error: any) {
      console.error(`Error updating scores for suggestion ${id}:`, error);
      alert('Failed to update suggestion scores. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new suggestion
  const createSuggestion = async (suggestionData: SuggestionFormData): Promise<void> => {
    try {
      setLoading(true);
      const newSuggestion = await apiService.createSuggestion(suggestionData);
      
      // Add to suggestions list
      setSuggestions([newSuggestion, ...suggestions]);
      
      // Navigate back to list view
      setView('list');
    } catch (error: any) {
      console.error('Error creating suggestion:', error);
      alert('Failed to create suggestion. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Merge suggestions
  const mergeSuggestions = async (targetId: string, sourceId: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.mergeSuggestions(targetId, sourceId) as unknown as MergeResponse;
      
      // Update suggestions list with merged suggestions
      // and remove the source suggestion since it's now deleted
      const updatedSuggestions = suggestions.filter(s => s.id !== sourceId).map(s => {
        if (s.id === targetId) {
          return response.target;
        }
        return s;
      });
      
      setSuggestions(updatedSuggestions);
      
      // Update selected suggestion if it's the one being merged
      if (selectedSuggestion && selectedSuggestion.id === targetId) {
        setSelectedSuggestion(response.target);
      } else if (selectedSuggestion && selectedSuggestion.id === sourceId) {
        // If the selected suggestion was the source, go back to list
        setView('list');
      }
    } catch (error: any) {
      console.error(`Error merging suggestions:`, error);
      alert('Failed to merge suggestions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a suggestion
  const deleteSuggestion = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;
    
    try {
      setLoading(true);
      await apiService.deleteSuggestion(id);
      
      // Remove the suggestion from the list
      setSuggestions(suggestions.filter(s => s.id !== id));
      
      // If the deleted suggestion was selected, go back to list view
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setView('list');
      }
    } catch (error: any) {
      console.error(`Error deleting suggestion ${id}:`, error);
      alert('Failed to delete suggestion. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Lock/unlock a suggestion
  const lockSuggestion = async (id: string, isLocked: boolean): Promise<void> => {
    // First check if the user is admin on the client side as an extra safety measure
    if (!userInfo.isAdmin) {
      alert('You do not have permission to perform this action.');
      return;
    }
    
    try {
      setLoading(true);
      // Pass the isAdmin flag to the API call
      const updatedSuggestion = await apiService.lockSuggestion(id, isLocked, userInfo.isAdmin);
      
      // Update the suggestions list
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return { ...s, isLocked: updatedSuggestion.isLocked };
        }
        return s;
      }));
      
      // Update selected suggestion if it's the one being updated
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion({ ...selectedSuggestion, isLocked: updatedSuggestion.isLocked });
      }
    } catch (error: any) {
      console.error(`Error locking/unlocking suggestion ${id}:`, error);
      if (error.message && error.message.includes('Permission denied')) {
        alert('You do not have permission to perform this action.');
      } else {
        alert(`Failed to ${isLocked ? 'lock' : 'unlock'} suggestion. Please try again later.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pin/unpin a suggestion
  const pinSuggestion = async (id: string, isPinned: boolean): Promise<void> => {
    // First check if the user is admin on the client side as an extra safety measure
    if (!userInfo.isAdmin) {
      alert('You do not have permission to perform this action.');
      return;
    }
    
    try {
      setLoading(true);
      // Pass the isAdmin flag to the API call
      const updatedSuggestion = await apiService.pinSuggestion(id, isPinned, userInfo.isAdmin);
      
      // Update the suggestions list
      setSuggestions(suggestions.map(s => {
        if (s.id === id) {
          return { ...s, isPinned: updatedSuggestion.isPinned };
        }
        return s;
      }));
      
      // Update selected suggestion if it's the one being updated
      if (selectedSuggestion && selectedSuggestion.id === id) {
        setSelectedSuggestion({ ...selectedSuggestion, isPinned: updatedSuggestion.isPinned });
      }
    } catch (error: any) {
      console.error(`Error pinning/unpinning suggestion ${id}:`, error);
      if (error.message && error.message.includes('Permission denied')) {
        alert('You do not have permission to perform this action.');
      } else {
        alert(`Failed to ${isPinned ? 'pin' : 'unpin'} suggestion. Please try again later.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepare to merge a suggestion
  const prepareMergeSuggestion = (id: string): void => {
    viewSuggestion(id).then(() => {
      setTimeout(() => {
        // Assuming there's a setMergeModalOpen state in the detail view
        // or pass this to SuggestionDetail component
        if (selectedSuggestion) {
          document.getElementById('openMergeModalButton')?.click();
        }
      }, 300);
    });
  };

  // Sort suggestions
  const sortedSuggestions = [...suggestions]
    .filter(suggestion => suggestion.status !== 'Merged') // Filter out merged suggestions
    .sort((a, b) => {
      // First prioritize pinned posts
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by votes or date
      if (sortBy === 'votes') {
        return b.votes - a.votes;
      }
      // Convert string timestamps to Date objects for proper comparison
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

  // Handler for setting view that accepts the correct type
  const handleSetView = (newView: string) => {
    setView(newView as 'list' | 'detail' | 'create' | 'dashboard');
  };

  const onAddCommentHandler: SuggestionDetailProps['onAddComment'] = 
    (id, text, isAnonymous, attachments) => addComment(id, text, isAnonymous, attachments || []);

  const onUpdateStatusHandler: SuggestionDetailProps['onUpdateStatus'] = 
    (id, status) => updateStatus(id, status);

  const onUpdateScoresHandler: SuggestionDetailProps['onUpdateScores'] = 
    (id, effort, impact) => updateScores(id, effort, impact);

  // Render different views based on state
  switch (view) {
    case 'dashboard':
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={false}
            toggleAnonymousMode={() => {}}
            setView={(newView) => setView(newView as 'list' | 'detail' | 'create' | 'dashboard')}
            user={userInfo as unknown as User}
            showDashboard={!!isAdmin}
          />
          <Dashboard 
            isAdmin={userInfo.isAdmin}
            onBack={() => setView('list')}
          />
        </div>
      );
    case 'detail':
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={false}
            toggleAnonymousMode={() => {}}
            setView={(newView) => setView(newView as 'list' | 'detail' | 'create' | 'dashboard')}
            user={userInfo as unknown as User}
            showDashboard={!!isAdmin}
          />
          {loading ? (
            <div className="max-w-xl mx-auto p-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p>Loading suggestion details...</p>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto p-4 text-center">
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
              onAddComment={onAddCommentHandler}
              onUpdateStatus={onUpdateStatusHandler}
              onUpdateScores={onUpdateScoresHandler}
              onMergeSuggestions={mergeSuggestions}
              onDelete={deleteSuggestion}
              onLock={lockSuggestion}
              onPin={pinSuggestion}
              currentUser={userInfo as unknown as User}
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
            setView={(newView) => setView(newView as 'list' | 'detail' | 'create' | 'dashboard')}
            user={userInfo as unknown as User}
            showDashboard={!!isAdmin}
          />
          <SuggestionForm 
            onSubmit={createSuggestion}
            onCancel={() => setView('list')}
            anonymousMode={anonymousMode}
            isSubmitting={loading}
            existingSuggestions={suggestions}
            onViewSuggestion={(id) => {
              setView('list');
              setTimeout(() => viewSuggestion(id), 100);
            }}
          />
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gray-100">
          <Header 
            anonymousMode={false}
            toggleAnonymousMode={() => {}}
            setView={(newView) => setView(newView as 'list' | 'detail' | 'create' | 'dashboard')}
            user={userInfo as unknown as User}
            showDashboard={!!isAdmin}
          />
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl font-bold">Improvement Ideas</h1>
                <p className="text-gray-600">Vote on existing ideas or suggest new ones.</p>
              </div>
              
              <button 
                onClick={() => setView('create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                Make a suggestion
              </button>
            </div>
            
            <div className="flex space-x-4 border-b mb-4">
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
              {isAdmin && (
                <button 
                  className="flex items-center pb-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setView('dashboard')}
                >
                  <PieChart size={16} className="mr-1" /> Dashboard
                </button>
              )}
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
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 