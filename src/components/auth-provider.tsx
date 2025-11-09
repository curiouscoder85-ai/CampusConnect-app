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
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { firestore, auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            // This can happen if the user record is created in Auth, but the
            // corresponding Firestore document creation fails.
            setUser(null);
            // Optionally sign out the user if a Firestore doc is required.
            // await signOut(auth);
          }
        } catch (error) {
          // This is where a permission error on getDoc would be caught.
          const contextualError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', contextualError);
          setUser(null); // Clear user state on permission error
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const login = async (email: string, pass: string): Promise<User | null> => {
    if (!auth) return null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error: any) {
      if (error.code && error.code.startsWith('auth/')) {
        // Handle Firebase Auth specific errors (e.g., wrong password)
        throw error;
      } else {
        // Handle other errors, like Firestore permission errors on getDoc
        const userDocRef = doc(firestore, 'users', auth.currentUser!.uid);
        const contextualError = new FirestorePermissionError({
            path: userDocRef.path,
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
    setUser(null);
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
      setUser(createdUser);
      return createdUser;

    } catch (error: any) {
       console.error("Signup failed:", error);
       throw error;
    }
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
