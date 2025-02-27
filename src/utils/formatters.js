// Utility functions for formatting data

// Format a date string into a user-friendly format
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // Format: "Feb 26, 2025 at 9:23 AM"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Parse a user's email to extract name
export const formatUserName = (userEmail) => {
  if (!userEmail) return '';
  
  // Check if it's already a name (not an email)
  if (!userEmail.includes('@')) {
    return userEmail;
  }
  
  // Extract name from email address
  const namePart = userEmail.split('@')[0];
  
  // Try to detect format and intelligently parse
  if (namePart.includes('.')) {
    // Handle firstname.lastname format
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } else if (namePart.includes('_')) {
    // Handle firstname_lastname format
    return namePart
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } else if (namePart.includes('-')) {
    // Handle firstname-lastname format
    return namePart
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  
  // If no recognized delimiter, just capitalize the first letter
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};