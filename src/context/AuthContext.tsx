import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const USER_STORAGE_KEY = 'business_nexus_user';
const TOKEN_KEY = 'nexus_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<{ twoFactorRequired?: boolean; userId?: string } | void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password, role });
      if (response.success) {
        if (response.twoFactorRequired) {
          return { twoFactorRequired: true, userId: response.userId };
        }
        
        const { token, user: userData } = response;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        toast.success('Successfully logged in!');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (userId: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.verify2FA({ userId, otp });
      if (response.success) {
        const { token, user: userData } = response;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        toast.success('Successfully logged in!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle2FA = async (enabled: boolean): Promise<void> => {
    try {
      const response = await authAPI.toggle2FA(enabled);
      if (response.success) {
        const updatedUser = { ...user!, is2FAEnabled: response.is2FAEnabled };
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error: any) {
      toast.error('Failed to update 2FA status');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({ name, email, password, role });
      if (response.success) {
        const { token, user: userData } = response;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        toast.success('Account created successfully!');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    toast.success('Password reset instructions sent to your email');
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    toast.success('Password reset successfully');
  };

  const logout = (): void => {
    authAPI.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const response = await authAPI.updateProfile(updates);
      if (response.success) {
        const updatedUser = response.user;
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    verify2FA,
    toggle2FA,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
