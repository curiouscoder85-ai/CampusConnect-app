'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import type { User as AppUser } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: AppUser | null;
  loading: boolean;
  reloadUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // This function is now defined inside the provider and not wrapped in useCallback
  // to ensure it always has access to the latest `firestore` and `setUser` state.
  const fetchUserDoc = async (firebaseUser: User | null) => {
    if (firebaseUser) {
        try {
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
            } else {
              // This case might happen if the Firestore user doc isn't created yet.
              setUser(null);
            }
        } catch (e) {
            console.error("Failed to fetch user document:", e);
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setLoading(true);
        fetchUserDoc(firebaseUser);
    });
    return () => unsubscribe();
  }, [auth]); // Removed fetchUserDoc from dependency array
  
  const reloadUser = useCallback(async () => {
    setLoading(true);
    // Directly call fetchUserDoc with the current user from auth.
    // This ensures we are always using the latest instance of the function.
    await fetchUserDoc(auth.currentUser);
  }, [auth]);


  const value = useMemo(
    () => ({
      firebaseApp,
      firestore,
      auth,
      storage,
      user,
      loading,
      reloadUser,
    }),
    [firebaseApp, firestore, auth, storage, user, loading, reloadUser]
  );

  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useStorage = (): FirebaseStorage => {
    const { storage } = useFirebase();
    return storage;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export interface UserHookResult {
  user: AppUser | null;
  isUserLoading: boolean;
}

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.loading };
};
