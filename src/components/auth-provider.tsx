'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { FirebaseStorage } from 'firebase/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  storage: FirebaseStorage | null;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { firestore, auth, storage, user, loading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const login = async (email: string, pass: string): Promise<User | null> => {
    if (!auth) return null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        return userData;
      }
      return null;
    } catch (error: any) {
      if (error.code && error.code.startsWith('auth/')) {
        throw error;
      } else {
        const contextualError = new FirestorePermissionError({
            path: `users/${auth.currentUser?.uid || 'unknown'}`,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', contextualError);
      }
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const signup = async (name: string, email: string, pass: string): Promise<User | null> => {
    if (!auth) return null;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );
      const { uid } = userCredential.user;
      
      let role: 'admin' | 'teacher' | 'student' = 'student';
      if (email.toLowerCase() === 'admin@campus.com') {
        role = 'admin';
      } else if (email.toLowerCase() === 'teacher@campus.com') {
        role = 'teacher';
      }

      const [firstName, lastName] = name.split(' ');

      const newUser: Omit<User, 'id'> = {
        name,
        email,
        role,
        firstName,
        lastName: lastName || '',
        avatar: `/avatars/0${(Math.floor(Math.random() * 5)) + 1}.png`,
      };

      const userDocRef = doc(firestore, 'users', uid);
      await setDoc(userDocRef, { ...newUser, id: uid });
      
      const createdUser = { id: uid, ...newUser } as User;
      return createdUser;

    } catch (error: any) {
       console.error("Signup failed:", error);
       throw error;
    }
  };

  const value = { user, loading, login, logout, signup, storage };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
