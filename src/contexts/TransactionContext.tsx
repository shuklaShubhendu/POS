import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db, COLLECTIONS } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Transaction } from '../types';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  getSalesData: () => {
    dailySales: number[];
    monthlySales: number[];
    topSellingItems: { name: string; count: number; revenue: number }[];
    salesBySection: { section: string; revenue: number; count: number }[];
  };
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.restaurantId) {
      toast.error('No restaurant ID found. Please log in again.');
      return;
    }

    const transactionsQuery = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('restaurantId', '==', currentUser.restaurantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactionsData: Transaction[] = [];
        snapshot.forEach((doc) => {
          transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(transactionsData);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.restaurantId) {
      toast.error('Not authenticated. Please log in.');
      throw new Error('Not authenticated');
    }

    try {
      // Sanitize transaction data to prevent undefined values
      const sanitizedTransaction = {
        ...transaction,
        customerName: transaction.customerName?.trim() || 'Anonymous',
        phoneNumber: transaction.phoneNumber?.trim() || '',
        tableNumber: transaction.tableNumber?.trim() || '',
        items: transaction.items?.map((item) => ({
          ...item,
          menuItem: {
            ...item.menuItem,
            id: item.menuItem?.id || '',
            name: item.menuItem?.name || 'Unknown Item',
            price: item.menuItem?.price || 0,
            section: item.menuItem?.section || 'Other',
          },
          quantity: item.quantity || 1,
          price: item.price || 0,
        })) || [],
        subtotal: transaction.subtotal || 0,
        tax: transaction.tax || 0,
        total: transaction.total || 0,
        paymentMethod: transaction.paymentMethod || 'other',
        restaurantId: currentUser.restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add transaction to Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), sanitizedTransaction);

      // If phoneNumber is provided, store customer data for later use
      if (sanitizedTransaction.phoneNumber) {
        const customerRef = collection(db, 'customers');
        const customerQuery = query(
          customerRef,
          where('phoneNumber', '==', sanitizedTransaction.phoneNumber),
          where('restaurantId', '==', currentUser.restaurantId)
        );
        const customerSnapshot = await getDocs(customerQuery);

        if (customerSnapshot.empty) {
          await addDoc(customerRef, {
            customerName: sanitizedTransaction.customerName,
            phoneNumber: sanitizedTransaction.phoneNumber,
            restaurantId: currentUser.restaurantId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const customerDoc = customerSnapshot.docs[0];
          await updateDoc(doc(db, 'customers', customerDoc.id), {
            customerName: sanitizedTransaction.customerName,
            updatedAt: serverTimestamp(),
          });
        }
      }

      toast.success('Transaction recorded successfully');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast.error(`Failed to record transaction: ${error.message}`);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!currentUser?.restaurantId) {
      toast.error('Not authenticated. Please log in.');
      throw new Error('Not authenticated');
    }

    try {
      const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, id);
      await updateDoc(transactionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      toast.success('Transaction updated successfully');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error(`Failed to update transaction: ${error.message}`);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser?.restaurantId) {
      toast.error('Not authenticated. Please log in.');
      throw new Error('Not authenticated');
    }

    try {
      const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, id);
      await deleteDoc(transactionRef);
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(`Failed to delete transaction: ${error.message}`);
      throw error;
    }
  };

  const getTransactionById = (id: string) => {
    return transactions.find((transaction) => transaction.id === id);
  };

  const getSalesData = () => {
    const dailySales: number[] = [];
    const dailyMap = new Map<string, number>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt as any).toDateString();
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + transaction.total);
    });

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailySales.push(dailyMap.get(date.toDateString()) || 0);
    }

    const monthlySales: number[] = [];
    const monthlyMap = new Map<string, number>();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt as any);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + transaction.total);
    });

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlySales.push(monthlyMap.get(monthKey) || 0);
    }

    const itemSales = new Map<string, { count: number; revenue: number }>();
    transactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const { name } = item.menuItem;
        const current = itemSales.get(name) || { count: 0, revenue: 0 };
        itemSales.set(name, {
          count: current.count + item.quantity,
          revenue: current.revenue + item.price * item.quantity,
        });
      });
    });

    const topSellingItems = Array.from(itemSales.entries())
      .map(([name, { count, revenue }]) => ({ name, count, revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const salesBySectionMap = new Map<string, { revenue: number; count: number }>();
    transactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const section = item.menuItem.section || 'Other';
        const current = salesBySectionMap.get(section) || { revenue: 0, count: 0 };
        salesBySectionMap.set(section, {
          revenue: current.revenue + item.price * item.quantity,
          count: current.count + item.quantity,
        });
      });
    });

    const salesBySection = Array.from(salesBySectionMap.entries()).map(([section, { revenue, count }]) => ({
      section,
      revenue,
      count,
    }));

    return {
      dailySales,
      monthlySales,
      topSellingItems,
      salesBySection,
    };
  };

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getSalesData,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};