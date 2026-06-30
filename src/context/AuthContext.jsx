import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('simjam-role') || 'pengguna';
  });

  const login = (username, password) => {
    if (username === 'admin' && password === 'pass123') {
      setRole('admin');
      localStorage.setItem('simjam-role', 'admin');
      return { success: true };
    }
    return { success: false, message: 'Username atau password salah!' };
  };

  const logout = () => {
    setRole('pengguna');
    localStorage.setItem('simjam-role', 'pengguna');
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ role, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
