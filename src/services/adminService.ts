import { useEffect, useState } from 'react';

// Cache for the admin emails
let adminEmailsCache: string[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 3600000; // 1 hour

const adminService = {
  // Load admin emails from text file
  loadAdminEmails: async (): Promise<string[]> => {
    const now = Date.now();

    if (adminEmailsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
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
  isAdmin: async (userEmail: string): Promise<boolean> => {
    if (!userEmail) return false;
    
    const emails = await adminService.loadAdminEmails();
    return emails.includes(userEmail.toLowerCase());
  }
};

export default adminService; 