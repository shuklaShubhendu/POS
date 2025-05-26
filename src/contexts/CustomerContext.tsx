import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Customer, CustomerCategory } from '../types';

interface CustomerContextType {
  customers: Customer[];
  categories: CustomerCategory[];
  addCustomer: (data: {
    name: string;
    phone?: string;
    email?: string;
    categoryId?: string | null;
  }) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const { currentUser, currentRestaurant } = useAuth();

  // Load initial data and set up real-time subscription
  useEffect(() => {
    if (!currentUser || !currentUser.restaurantId) return;

    // Subscribe to categories collection first
    const categoriesQuery = query(
      collection(db, COLLECTIONS.CUSTOMER_CATEGORIES),
      where('restaurantId', '==', currentUser.restaurantId)
    );

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData: CustomerCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CustomerCategory[];
      setCategories(categoriesData);
    });

    // Subscribe to customers collection
    const customersQuery = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('restaurantId', '==', currentUser.restaurantId)
    );

    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData: Customer[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const category = categories.find((cat) => cat.id === data.categoryId) || {
          id: '',
          name: 'No Category',
        };
        return {
          id: doc.id,
          ...data,
          category, // Add category object for UI compatibility
        } as Customer;
      });
      setCustomers(customersData);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeCategories();
    };
  }, [currentUser, currentRestaurant, categories]); // Added categories to dependencies

  const addCustomer = async (data: {
    name: string;
    phone?: string;
    email?: string;
    categoryId?: string | null;
  }) => {
    if (!currentUser || !currentUser.restaurantId) {
      throw new Error('User not authenticated or restaurant ID missing');
    }

    try {
      await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
        restaurantId: currentUser.restaurantId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        categoryId: data.categoryId || null,
        discountRate: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      throw new Error('Failed to add customer. Please try again.');
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!currentUser || !currentUser.restaurantId) {
      throw new Error('User not authenticated or restaurant ID missing');
    }

    try {
      const customerRef = doc(db, COLLECTIONS.CUSTOMERS, id);
      await updateDoc(customerRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer. Please try again.');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!currentUser || !currentUser.restaurantId) {
      throw new Error('User not authenticated or restaurant ID missing');
    }

    try {
      const customerRef = doc(db, COLLECTIONS.CUSTOMERS, id);
      await deleteDoc(customerRef);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer. Please try again.');
    }
  };

  const getCustomerById = (id: string) => {
    return customers.find((customer) => customer.id === id);
  };

  const value = {
    customers,
    categories,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};