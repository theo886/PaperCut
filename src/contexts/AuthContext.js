import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import adminService from '../services/adminService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userInfo = await authService.getUser();
        
        // Check if user is admin based on email list
        if (userInfo && userInfo.userDetails) {
          const isUserAdmin = await adminService.isAdmin(userInfo.userDetails);
          userInfo.isAdmin = isUserAdmin;
        }
        
        setUser(userInfo);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = () => {
    authService.login();
  };

  const logout = () => {
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
