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
      
      return handleResponse(response);
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
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true' // Add admin header
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
  }
};

export default apiService;