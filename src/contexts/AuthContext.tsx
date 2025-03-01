import React, { createContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import adminService from '../services/adminService';
import { User, AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      try {
        const userInfo = await authService.getUser();
        
        // Check if user is admin based on email list
        let userIsAdmin = false;
        if (userInfo && userInfo.userDetails) {
          userIsAdmin = await adminService.isAdmin(userInfo.userDetails);
        }
        
        setUser(userInfo);
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (): void => {
    authService.login();
  };

  const logout = (): void => {
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 