import { 
  Suggestion, 
  SuggestionFormData, 
  Attachment, 
  DashboardMetrics,
  Comment
} from '../types';

// Helper function to convert a file to base64
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extract the base64 data from the result
      // reader.result is like "data:image/png;base64,iVBORw0KGgo..."
      // We only want the part after the comma
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface FileData {
  name: string;
  size: number;
  contentType: string;
  data: string;
}

interface ApiError extends Error {
  status?: number;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `API error: ${response.status}`) as ApiError;
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
};

interface CommentData {
  text: string;
  isAnonymous: boolean;
  attachments?: Attachment[];
}

interface UpdateSuggestionData {
  status?: string;
  effortScore?: number;
  impactScore?: number;
  departments?: string[];
  title?: string;
  description?: string;
}

interface MergeSuggestionsData {
  sourceId: string;
}

const apiService = {
  // Upload a file
  uploadFile: async (file: File): Promise<Attachment> => {
    try {
      // Create a FormData object
      const fileData: FileData = {
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
      
      return handleResponse<Attachment>(response);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get all suggestions
  getSuggestions: async (): Promise<Suggestion[]> => {
    try {
      const response = await fetch('/api/suggestions');
      return handleResponse<Suggestion[]>(response);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // Get a specific suggestion
  getSuggestionById: async (id: string): Promise<Suggestion> => {
    try {
      const response = await fetch(`/api/suggestions/${id}`);
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error fetching suggestion ${id}:`, error);
      throw error;
    }
  },

  // Create a new suggestion
  createSuggestion: async (suggestionData: SuggestionFormData): Promise<Suggestion> => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(suggestionData)
      });
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  },

  // Update a suggestion
  updateSuggestion: async (id: string, suggestionData: UpdateSuggestionData): Promise<Suggestion> => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true' // Add admin header
        },
        body: JSON.stringify(suggestionData)
      });
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error updating suggestion ${id}:`, error);
      throw error;
    }
  },

  // Add a comment to a suggestion
  addComment: async (suggestionId: string, commentData: CommentData): Promise<Suggestion> => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error adding comment to suggestion ${suggestionId}:`, error);
      throw error;
    }
  },

  // Vote for a suggestion
  voteSuggestion: async (id: string): Promise<Suggestion> => {
    try {
      const response = await fetch(`/api/suggestions/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error voting for suggestion ${id}:`, error);
      throw error;
    }
  },
  
  // Merge suggestions
  mergeSuggestions: async (targetId: string, sourceId: string): Promise<Suggestion> => {
    try {
      const response = await fetch(`/api/suggestions/${targetId}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true' // Add this header to indicate admin status
        },
        body: JSON.stringify({ sourceId })
      });
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error merging suggestions:`, error);
      throw error;
    }
  },
  
  // Get all suggestions for admin
  getAllSuggestions: async (): Promise<Suggestion[]> => {
    try {
      const response = await fetch('/api/suggestions');
      return handleResponse<Suggestion[]>(response);
    } catch (error) {
      console.error('Error fetching all suggestions:', error);
      throw error;
    }
  },
  
  // Delete a suggestion
  deleteSuggestion: async (id: string): Promise<{ message: string }> => {
    try {
      // Clean implementation using only DELETE - no fallbacks
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Status': 'true'  // Send admin header for authorization
        }
      });
      return handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error(`Error deleting suggestion ${id}:`, error);
      throw error;
    }
  },

  // Lock/unlock a suggestion
  lockSuggestion: async (id: string, isLocked: boolean, isAdmin: boolean): Promise<Suggestion> => {
    try {
      const headers: Record<string, string> = {
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
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error locking/unlocking suggestion ${id}:`, error);
      throw error;
    }
  },

  // Pin/unpin a suggestion
  pinSuggestion: async (id: string, isPinned: boolean, isAdmin: boolean): Promise<Suggestion> => {
    try {
      const headers: Record<string, string> = {
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
      return handleResponse<Suggestion>(response);
    } catch (error) {
      console.error(`Error pinning/unpinning suggestion ${id}:`, error);
      throw error;
    }
  },
  
  // Get dashboard metrics
  getDashboardMetrics: async (isAdmin: boolean): Promise<DashboardMetrics> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (isAdmin) {
        headers['X-Admin-Status'] = 'true';
      }
      
      const response = await fetch('/api/metrics', {
        method: 'GET',
        headers: headers
      });
      
      return handleResponse<DashboardMetrics>(response);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }
};

export default apiService; 