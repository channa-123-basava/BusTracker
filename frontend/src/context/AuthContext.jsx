import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cbt_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cbt_token') || null);
  const [loading, setLoading] = useState(true);

  const saveAuth = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('cbt_user', JSON.stringify(userData));
    localStorage.setItem('cbt_token', tokenData);
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cbt_user');
    localStorage.removeItem('cbt_token');
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.data.user);
        localStorage.setItem('cbt_user', JSON.stringify(res.data.data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = async (identifier, password) => {
    const res = await authAPI.login({ identifier, password });
    const { token: t, user: u } = res.data.data;
    saveAuth(u, t);
    return u;
  };

  const forgotPassword = async (email) => {
    const res = await authAPI.forgotPassword({ email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await authAPI.resetPassword(token, { password });
    const { token: t, user: u } = res.data.data;
    if (t && u) {
      saveAuth(u, t);
    }
    return u;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token: t, user: u } = res.data.data;
    saveAuth(u, t);
    return u;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cbt_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, forgotPassword, resetPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
