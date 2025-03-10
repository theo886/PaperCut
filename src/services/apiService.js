// API service for interacting with the backend

// Helper function to convert a file to base64
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extract the base64 data from the result
      // reader.result is like "data:image/png;base64,iVBORw0KGgo..."
      // We only want the part after the comma
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const apiService = {
  // Upload a file
  uploadFile: async (file) => {
    try {
      // Create a FormData object
      const fileData = {
        name: file.name,
        size: file.size,
        contentType: file.type,
        data: await readFileAsBase64(file)
      };
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file: fileData })
      });
      
      const result = await handleResponse(response);
      // Add original filename to the result
      result.name = file.name;
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
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
      console.log('Sending suggestion creation request to API:', suggestionData);
      
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(suggestionData)
      });
      
      console.log('Received API response with status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from createSuggestion API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Try to parse as JSON if possible
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          console.error('Parsed error JSON:', errorJson);
        } catch (e) {
          console.error('Could not parse error as JSON, raw text:', errorText);
          // Not JSON, use as is
        }
        
        const error = new Error(
          errorJson?.message || 
          `API error (${response.status}): ${response.statusText}`
        );
        error.response = response;
        error.data = errorJson;
        error.statusCode = response.status;
        error.fullDetails = {
          status: response.status,
          statusText: response.statusText,
          errorData: errorJson || errorText
        };
        throw error;
      }
      
      const data = await response.json();
      console.log('Successful response from createSuggestion API:', data);
      return data;
    } catch (error) {
      console.error('Exception in createSuggestion:', error);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error detected - possibly CORS or connectivity issue');
        throw new Error('Network error: could not connect to the API. Please check your connection and try again.');
      }
      
      throw error;
    }
  },

  // Update a suggestion
  updateSuggestion: async (id, suggestionData) => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true' // Add admin header
        },
        body: JSON.stringify(suggestionData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`MERGEPIN Client: Error updating suggestion ${id}:`, error);
      throw error;
    }
  },

  // Add a comment to a suggestion
  addComment: async (suggestionId, commentData) => {
    try {
      console.log('apiService: Starting addComment API call');
      console.log('suggestionId:', suggestionId);
      console.log('commentData:', commentData);
      
      // Get auth headers to debug what's being sent
      const headers = {
        'Content-Type': 'application/json'
      };
      
      console.log('Request headers:', headers);
      console.log('apiService: Sending comment data to backend:', {
        suggestionId,
        commentData
      });
      
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commentData)
      });
      
      console.log('apiService: Raw response status:', response.status);
      const responseData = await handleResponse(response);
      console.log('apiService: Received comment response from backend:', responseData);
      
      // Log the latest comment
      if (responseData && responseData.comments && responseData.comments.length > 0) {
        const latestComment = responseData.comments[responseData.comments.length - 1];
        console.log('Latest comment in response:', latestComment);
      }
      
      return responseData;
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
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true' // Add this header to indicate admin status
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
  },
  
  // Delete a suggestion
  deleteSuggestion: async (id) => {
    try {
      // Clean implementation using only DELETE - no fallbacks
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true'  // Send admin header for authorization
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error deleting suggestion ${id}:`, error);
      throw error;
    }
  },

  // Lock/unlock a suggestion
  lockSuggestion: async (id, isLocked, isAdmin) => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isAdmin) {
        headers['X-Admin-Status'] = 'true';
      }
      
      // Create proper lock endpoint at /api/suggestions/{id}/lock on the backend
      const response = await fetch(`/api/suggestions/${id}/lock`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ isLocked })
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error locking/unlocking suggestion ${id}:`, error);
      throw error;
    }
  },

  // Pin/unpin a suggestion
  pinSuggestion: async (id, isPinned, isAdmin) => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isAdmin) {
        headers['X-Admin-Status'] = 'true';
      }
      
      // Create proper pin endpoint at /api/suggestions/{id}/pin on the backend
      const response = await fetch(`/api/suggestions/${id}/pin`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ isPinned })
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error pinning/unpinning suggestion ${id}:`, error);
      throw error;
    }
  },
  
  // Get dashboard metrics
  getDashboardMetrics: async (isAdmin) => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isAdmin) {
        headers['X-Admin-Status'] = 'true';
      }
      
      const response = await fetch('/api/metrics', {
        method: 'GET',
        headers: headers
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },
  
  // Delete a comment
  deleteComment: async (suggestionId, commentId) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  },
  
  // Edit a comment
  editComment: async (suggestionId, commentId, text) => {
    try {
      console.log(`Editing comment ${commentId} for suggestion ${suggestionId} with text:`, text);
      
      const response = await fetch(`/api/suggestions/${suggestionId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from editComment API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Try to parse as JSON if possible
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use as is
        }
        
        const error = new Error(
          errorJson?.message || 
          `API error (${response.status}): ${response.statusText}`
        );
        error.response = response;
        error.data = errorJson;
        throw error;
      }
      
      const data = await response.json();
      console.log('Successful response from editComment API:', data);
      return data;
    } catch (error) {
      console.error(`Error editing comment ${commentId}:`, error);
      throw error;
    }
  },
  
  // Like a comment
  likeComment: async (suggestionId, commentId) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error liking comment ${commentId}:`, error);
      throw error;
    }
  }
};

export default apiService;