import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, if token exists try to fetch profile from backend
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      setUser(res.data.user || null);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const token = res.data.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      setUser(res.data.user || null);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    // Mock profile update
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    return { success: true };
  };

  const changePassword = async (currentPassword, newPassword) => {
    // Mock password change
    return { success: true };
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
