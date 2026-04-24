import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { createContext, useContext, useEffect, useState } from 'react';

const app = initializeApp(firebaseConfig);
// Cast required because firebaseConfig.firestoreDatabaseId is a property added by the setup tool
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export type AppRole = 'athlete' | 'coach' | 'nutritionist';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AppRole;
  teamId?: string;
  age?: number;
  weight?: number;
  height?: number;
  goals?: string;
  allergies?: string;
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create initial profile
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'New User',
        role: 'athlete', // Default role
      };
      await setDoc(userRef, newProfile);
    }
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOut = () => fbSignOut(auth);
