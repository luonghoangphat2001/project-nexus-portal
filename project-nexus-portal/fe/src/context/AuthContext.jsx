import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('nexus_auth_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res && res.data) {
            setUser(res.data);
            localStorage.setItem('nexus_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing state.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    const res = await api.post('/auth/login', { usernameOrEmail, password });
    if (res && res.data) {
      const { accessToken, user: userData } = res.data;
      localStorage.setItem('nexus_auth_token', accessToken);
      localStorage.setItem('nexus_user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      return userData;
    }
    throw new Error('Invalid login response from server');
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    if (updatedUserData) {
      setUser((prev) => {
        const merged = { ...prev, ...updatedUserData };
        localStorage.setItem('nexus_user', JSON.stringify(merged));
        return merged;
      });
    }
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    const formattedRole = roleName.startsWith('ROLE_') ? roleName : `ROLE_${roleName}`;
    return user.roles.includes(formattedRole) || user.roles.includes('ROLE_ADMIN');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
