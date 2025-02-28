import { useEffect, useState } from 'react';

// Cache for the admin emails
let adminEmailsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 hour

const adminService = {
  // Load admin emails from text file
  loadAdminEmails: async () => {
    const now = Date.now();

    if (adminEmailsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return adminEmailsCache;
    }

    try {
      const response = await fetch('/adminEmails.txt');
      if (!response.ok) {
        console.error('Failed to load admin emails file');
        return [];
      }

      const text = await response.text();
      adminEmailsCache = text
        .split('\n')
        .map(email => email.trim())
        .filter(email => email && !email.startsWith('#')); // Skip empty lines and comments
      
      cacheTimestamp = now;
      return adminEmailsCache;
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