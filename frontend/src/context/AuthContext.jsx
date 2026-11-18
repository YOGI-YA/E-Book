import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token) {
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            const actualUser = parsed.data ?? parsed;
            setUser(actualUser);
            setIsAuthenticated(true);
          } catch {
            // ignore JSON parse error
          }
        }

        // Fetch fresh profile from backend
        try {
          const profileRes = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
          if (profileRes.data?.data) {
            const freshUser = profileRes.data.data;
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
            setIsAuthenticated(true);
          }
        } catch (err) {
          // If token is expired (401), clean up
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = (userData, token) => {
    const actualData = userData?.data ?? userData;
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(actualData));

    setUser(actualData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    const actualData = updatedUser?.data ?? updatedUser;
    const newUserData = { ...user, ...actualData };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
