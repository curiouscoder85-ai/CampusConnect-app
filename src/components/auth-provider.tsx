'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, users as mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => User;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a logged-in user in localStorage
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse user from localStorage", error)
      localStorage.removeItem('campus-connect-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email: string, pass: string): User => {
    // This is a mock login function. In a real app, you'd call Firebase Auth.
    const foundUser = mockUsers.find(u => u.email === email);
    if (!foundUser) {
      throw new Error('User not found.');
    }
    // Mock password check
    if (pass !== 'password123') {
        throw new Error('Invalid password.');
    }

    localStorage.setItem('campus-connect-user', JSON.stringify(foundUser));
    setUser(foundUser);
    return foundUser;
  };

  const logout = () => {
    // In a real app, call Firebase signOut
    localStorage.removeItem('campus-connect-user');
    setUser(null);
    router.push('/');
  };

  const signup = (name: string, email: string, pass: string): User => {
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }
    const newUser: User = {
      id: String(mockUsers.length + 1),
      name,
      email,
      role: 'student', // Default role
      avatar: `/avatars/0${(mockUsers.length % 5) + 1}.png`,
    };
    // In a real app, you would add this user to Firestore
    mockUsers.push(newUser);
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };


  const value = { user, loading, login, logout, signup };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
