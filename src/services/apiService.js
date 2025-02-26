// API service for interacting with the backend

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const apiService = {
  // Get all suggestions
  getSuggestions: async () => {
    try {
      const response = await fetch('/api/suggestions');
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // Get a specific suggestion
  getSuggestionById: async (id) => {
    try {
      const response = await fetch(`/api/suggestions/${id}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching suggestion ${id}:`, error);
      throw error;
    }
  },

  // Create a new suggestion
  createSuggestion: async (suggestionData) => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(suggestionData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  },

  // Update a suggestion
  updateSuggestion: async (id, suggestionData) => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(suggestionData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error updating suggestion ${id}:`, error);
      throw error;
    }
  },

  // Add a comment to a suggestion
  addComment: async (suggestionId, commentData) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error adding comment to suggestion ${suggestionId}:`, error);
      throw error;
    }
  },

  // Vote for a suggestion
  voteSuggestion: async (id) => {
    try {
      const response = await fetch(`/api/suggestions/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error voting for suggestion ${id}:`, error);
      throw error;
    }
  },
  
  // Merge suggestions
  mergeSuggestions: async (targetId, sourceId) => {
    try {
      const response = await fetch(`/api/suggestions/${targetId}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourceId })
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error merging suggestions:`, error);
      throw error;
    }
  },
  
  // Get all suggestions for admin
  getAllSuggestions: async () => {
    try {
      const response = await fetch('/api/suggestions');
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching all suggestions:', error);
      throw error;
    }
  }
};

export default apiService;