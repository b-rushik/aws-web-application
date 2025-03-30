import React, { createContext, useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      // Extract role from user attributes
      const userRole = currentUser.attributes['custom:role'] || 'guest';
      setRole(userRole);
    } catch (error) {
      setUser(null);
      setRole('guest');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const user = await Auth.signIn(email, password);
      setUser(user);
      const userRole = user.attributes['custom:role'] || 'guest';
      setRole(userRole);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setRole('guest');
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};