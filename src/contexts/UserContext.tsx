import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db, auth } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface UserContextType {
  users: User[];
  addUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    restaurantId: string;
  }) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => Promise<User | undefined>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const userCollection = collection(db, 'users');

  // Real-time listener for users
  useEffect(() => {
    const unsubscribe = onSnapshot(userCollection, (snapshot) => {
      const userList: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<User, 'id'>),
      }));
      setUsers(userList);
    });

    return () => unsubscribe();
  }, []);

  const addUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    restaurantId: string;
  }) => {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Update display name in Firebase Authentication
      await updateProfile(userCredential.user, {
        displayName: userData.name,
      });

      // Add user to Firestore
      const newUser = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        restaurantId: userData.restaurantId,
        createdAt: new Date().toISOString(),
        authId: userCredential.user.uid,
      };

      const docRef = await addDoc(userCollection, newUser);
      // No need to manually update state since onSnapshot will handle it
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to create user: ' + (error as Error).message);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, updates);
      // onSnapshot will handle state update
    } catch (error) {
      throw new Error('Failed to update user: ' + (error as Error).message);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const userRef = doc(db, 'users', id);
      await deleteDoc(userRef);
      // onSnapshot will handle state update
    } catch (error) {
      throw new Error('Failed to delete user: ' + (error as Error).message);
    }
  };

  const getUserById = async (id: string) => {
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...(userSnap.data() as Omit<User, 'id'>) };
    }
    return undefined;
  };

  const value = {
    users,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};