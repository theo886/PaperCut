import { useEffect, useState } from 'react';

// Cache for the admin emails
let adminEmails = null;

const adminService = {
  // Load admin emails from text file
  loadAdminEmails: async () => {
    try {
      if (adminEmails !== null) {
        return adminEmails;
      }

      const response = await fetch('/adminEmails.txt');
      if (!response.ok) {
        console.error('Failed to load admin emails file');
        return [];
      }

      const text = await response.text();
      adminEmails = text
        .split('\n')
        .map(email => email.trim())
        .filter(email => email && !email.startsWith('#')); // Skip empty lines and comments
      
      return adminEmails;
    } catch (error) {
      console.error('Error loading admin emails:', error);
      return [];
    }
  },

  // Check if a user is an admin
  isAdmin: async (userEmail) => {
    if (!userEmail) return false;
    
    const emails = await adminService.loadAdminEmails();
    return emails.includes(userEmail.toLowerCase());
  }
};

export default adminService;