import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../lib/firebase';
import { User, UserRole, Restaurant } from '../types';

interface AuthContextType {
  currentUser: User | null;
  currentRestaurant: Restaurant | null;
  login: (email: string, password: string) => Promise<UserRole | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  registerRestaurant: (data: {
    restaurantName: string;
    adminName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser(userData);

            if (userData.restaurantId) {
              const restaurantDoc = await getDoc(doc(db, COLLECTIONS.RESTAURANTS, userData.restaurantId));
              if (restaurantDoc.exists()) {
                setCurrentRestaurant(restaurantDoc.data() as Restaurant);
              } else {
                console.warn(`Restaurant document with ID ${userData.restaurantId} not found.`);
                setCurrentRestaurant(null);
              }
            } else {
              console.warn(`User ${firebaseUser.uid} has no associated restaurantId.`);
              setCurrentRestaurant(null);
            }

            setIsAuthenticated(true);
          } else {
            console.warn(`Firestore user document for UID ${firebaseUser.uid} not found. Signing out.`);
            setCurrentUser(null);
            setCurrentRestaurant(null);
            setIsAuthenticated(false);
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error fetching user or restaurant data:', error);
          setCurrentUser(null);
          setCurrentRestaurant(null);
          setIsAuthenticated(false);
        }
      } else {
        setCurrentUser(null);
        setCurrentRestaurant(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole | null> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
          lastLogin: serverTimestamp(),
        }, { merge: true });
        return userData.role as UserRole;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const registerRestaurant = async (data: {
    restaurantName: string;
    adminName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, uid);
      await setDoc(restaurantRef, {
        id: uid,
        name: data.restaurantName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        currency: '₹',
        taxRate: 5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await setDoc(userRef, {
        id: uid,
        name: data.adminName,
        email: data.email,
        role: 'admin',
        restaurantId: uid,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error registering restaurant:', error);
      throw error;
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;

    if (currentUser.role === 'superadmin') return true;

    if (currentUser.role === 'admin' && ['admin', 'manager', 'employee'].includes(requiredRole)) {
      return true;
    }

    if (currentUser.role === 'manager' && ['manager', 'employee'].includes(requiredRole)) {
      return true;
    }

    return currentUser.role === requiredRole;
  };

  const value = {
    currentUser,
    currentRestaurant,
    login,
    logout,
    resetPassword,
    registerRestaurant,
    isAuthenticated,
    hasRole,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-gray-700">
        Loading authentication state...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};