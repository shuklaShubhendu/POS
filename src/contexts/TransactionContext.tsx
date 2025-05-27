import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Transaction } from '../types';
import { z } from 'zod';

// Interface for menu sections
interface MenuSection {
  id: string;
  name: string;
}

// TransactionContext interface
interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  getSalesData: (options?: { range: '7days' | '30days' }) => {
    dailySalesData: number[];
    monthlySales: number[];
    topSellingItems: Array<{ name: string; count: number; revenue: number }>;
    salesBySection: Array<{ name: string; revenue: number; count: number }>;
    statusBreakdown: Array<{ day: string; completed: number; refunded: number; cancelled: number }>;
    paymentMethodData: Array<{ name: string; value: number }>;
    employeeSalesData: Array<{ name: string; revenue: number; count: number }>;
    tableSalesData: Array<{ table: string; revenue: number }>;
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

// Zod schema for transaction validation
const TransactionSchema = z.object({
  customerName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  tableNumber: z.string().nullable().optional(),
  items: z.array(
    z.object({
      menuItem: z.object({
        id: z.string().min(1, 'Menu item ID is required'),
        name: z.string().min(1, 'Menu item name is required'),
        price: z.number().min(0, 'Price must be non-negative'),
        sectionId: z.string().optional(),
        section: z.string().optional(),
      }),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      price: z.number().min(0, 'Item price must be non-negative'),
    })
  ).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  tax: z.number().min(0, 'Tax must be non-negative'),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  paymentMethod: z.enum(['cash', 'card', 'other'], { message: 'Invalid payment method' }),
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  employeeName: z.string().min(1, 'Employee name is required'),
  status: z.enum(['completed', 'refunded', 'cancelled'], { message: 'Invalid status' }),
});

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const { currentUser, loading } = useAuth();

  // Fetch transactions
  useEffect(() => {
    if (loading || !currentUser?.restaurantId) {
      if (!loading) toast.error('No restaurant ID found. Please log in again.');
      return;
    }

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('restaurantId', '==', currentUser.restaurantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactionsData: Transaction[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
          if (!createdAt) {
            console.warn(`Transaction ${doc.id} missing createdAt, skipping.`);
            return;
          }
          transactionsData.push({
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
          } as Transaction);
        });
        setTransactions(transactionsData);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        toast.error('Error loading transactions');
      }
    );

    return () => unsubscribe();
  }, [currentUser, loading]);

  // Fetch menu sections
  useEffect(() => {
    if (loading || !currentUser?.restaurantId) return;

    const sectionsQuery = query(
      collection(db, 'menu_sections'),
      where('restaurantId', '==', currentUser.restaurantId)
    );
    const unsubscribe = onSnapshot(
      sectionsQuery,
      (snapshot) => {
        const sectionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown',
        }));
        setMenuSections(sectionsData);
      },
      (error) => {
        console.error('Error fetching menu sections:', error);
        toast.error('Error loading menu sections');
      }
    );

    return () => unsubscribe();
  }, [currentUser, loading]);

  // Sales data calculation
  const getSalesData = useMemo(() => {
    return ({ range = '7days' }: { range?: '7days' | '30days' } = {}) => {
      // Define days array for 7-day view
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      // Determine number of days and labels based on range
      const numDays = range === '7days' ? 7 : 30;
      const dayLabels = range === '7days'
        ? days
        : Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });

      // Create a map for quick lookup of section names by their IDs
      const sectionNameMap = new Map<string, string>();
      menuSections.forEach(section => {
        sectionNameMap.set(section.id, section.name);
      });

      // Daily Sales calculation
      const dailySalesData: number[] = new Array(numDays).fill(0);
      const dayMapping: { [key: string]: number } = range === '7days'
        ? { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }
        : dayLabels.reduce((map, day, index) => ({ ...map, [day]: index }), {});

      // Transaction Status Breakdown
      const statusBreakdown: { day: string; completed: number; refunded: number; cancelled: number }[] = dayLabels.map(day => ({
        day: day.substring(0, 3),
        completed: 0,
        refunded: 0,
        cancelled: 0,
      }));

      // Monthly Sales calculation
      const monthlySales: number[] = [];
      const monthlyMap = new Map<string, number>();

      // Top Selling Items calculation
      const itemSales = new Map<string, { count: number; revenue: number }>();

      // Sales by Section calculation
      const salesBySectionMap = new Map<string, { revenue: number; count: number }>();

      // Payment Method calculation
      const paymentMethodMap = new Map<string, number>([
        ['cash', 0],
        ['card', 0],
        ['other', 0],
      ]);

      // Employee Sales calculation
      const employeeSalesMap = new Map<string, { revenue: number; count: number }>();

      // Table Sales calculation
      const tableSalesMap = new Map<string, number>();

      // Filter transactions by date range
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - (numDays - 1));

      transactions.forEach((transaction) => {
        if (!transaction.createdAt) {
          console.warn(`Transaction ${transaction.id} missing createdAt, skipping.`);
          return;
        }
        const transactionDate = new Date(transaction.createdAt);
        if (transactionDate < startDate) return;

        // Daily Sales and Status Breakdown
        const dayName = transactionDate.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDayName = transactionDate.toLocaleDateString('en-US', { weekday: 'short' });
        const graphIndex = range === '7days'
          ? dayMapping[dayName]
          : dayLabels.findIndex(label => label === shortDayName);

        if (graphIndex !== undefined && graphIndex >= 0) {
          if (transaction.status === 'completed') {
            dailySalesData[graphIndex] += transaction.totalAmount;
            statusBreakdown[graphIndex].completed += 1;
          } else if (transaction.status === 'refunded') {
            dailySalesData[graphIndex] -= transaction.totalAmount;
            statusBreakdown[graphIndex].refunded += 1;
          } else if (transaction.status === 'cancelled') {
            statusBreakdown[graphIndex].cancelled += 1;
          }
        }

        // Monthly Sales
        const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;
        const currentMonth = monthlyMap.get(monthKey) || 0;
        if (transaction.status === 'completed') {
          monthlyMap.set(monthKey, currentMonth + transaction.totalAmount);
        } else if (transaction.status === 'refunded') {
          monthlyMap.set(monthKey, currentMonth - transaction.totalAmount);
        }

        // Top Selling Items
        if (transaction.status === 'completed') {
          transaction.items.forEach((item) => {
            const itemPrice = item.menuItem?.price || 0;
            const itemQuantity = item.quantity || 0;
            const calculatedItemRevenue = itemPrice * itemQuantity;
            const name = item.menuItem?.name || 'Unknown Item';
            const current = itemSales.get(name) || { count: 0, revenue: 0 };
            itemSales.set(name, {
              count: current.count + itemQuantity,
              revenue: current.revenue + calculatedItemRevenue,
            });
          });
        }

        // Sales by Section
        if (transaction.status === 'completed') {
          transaction.items.forEach((item) => {
            const sectionId = item.menuItem?.sectionId;
            const sectionName = sectionId ? sectionNameMap.get(sectionId) || 'Unknown Category' : 'Unknown Category';
            const itemPrice = item.menuItem?.price || 0;
            const itemQuantity = item.quantity || 0;
            const calculatedItemRevenue = itemPrice * itemQuantity;
            const current = salesBySectionMap.get(sectionName) || { revenue: 0, count: 0 };
            salesBySectionMap.set(sectionName, {
              revenue: current.revenue + calculatedItemRevenue,
              count: current.count + itemQuantity,
            });
          });
        }

        // Payment Method
        if (transaction.status === 'completed' && transactionDate >= startDate) {
          const current = paymentMethodMap.get(transaction.paymentMethod) || 0;
          paymentMethodMap.set(transaction.paymentMethod, current + transaction.totalAmount);
        }

        // Employee Sales
        if (transaction.status === 'completed' && transactionDate >= startDate) {
          const employeeName = transaction.employeeName || 'Unknown';
          const current = employeeSalesMap.get(employeeName) || { revenue: 0, count: 0 };
          employeeSalesMap.set(employeeName, {
            revenue: current.revenue + transaction.totalAmount,
            count: current.count + 1,
          });
        }

        // Table Sales
        if (transaction.status === 'completed' && transaction.tableNumber && transactionDate >= startDate) {
          const table = transaction.tableNumber;
          const current = tableSalesMap.get(table) || 0;
          tableSalesMap.set(table, current + transaction.totalAmount);
        }
      });

      // Populate monthlySales for the last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthlySales.push(monthlyMap.get(monthKey) || 0);
      }

      // Top Selling Items
      const topSellingItems = Array.from(itemSales.entries())
        .map(([name, { count, revenue }]) => ({ name, count, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Sales by Section
      const salesBySection = Array.from(salesBySectionMap.entries()).map(([name, { revenue, count }]) => ({
        name,
        revenue,
        count,
      }));

      // Payment Method Data
      const paymentMethodData = ['cash', 'card', 'other'].map(method => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: paymentMethodMap.get(method) || 0,
      }));

      // Employee Sales Data
      const employeeSalesData = Array.from(employeeSalesMap.entries())
        .map(([name, { revenue, count }]) => ({ name, revenue, count }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Table Sales Data
      const tableSalesData = Array.from(tableSalesMap.entries())
        .map(([table, revenue]) => ({ table, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        dailySalesData,
        monthlySales,
        topSellingItems,
        salesBySection,
        statusBreakdown,
        paymentMethodData,
        employeeSalesData,
        tableSalesData,
      };
    };
  }, [transactions, menuSections]);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!currentUser?.restaurantId) {
        toast.error('Not authenticated. Please log in.');
        throw new Error('Not authenticated');
      }

      try {
        const validatedTransaction = TransactionSchema.parse({
          ...transaction,
          restaurantId: currentUser.restaurantId,
        });

        const sanitizedTransaction = {
          ...validatedTransaction,
          customerName: validatedTransaction.customerName?.trim() || null,
          customerPhone: validatedTransaction.customerPhone?.trim() || null,
          tableNumber: validatedTransaction.tableNumber?.trim() || null,
          items: validatedTransaction.items.map((item) => ({
            ...item,
            menuItem: {
              ...item.menuItem,
              id: item.menuItem?.id || '',
              name: item.menuItem?.name || 'Unknown Item',
              price: item.menuItem?.price || 0,
              section: item.menuItem?.section || 'Other',
              sectionId: item.menuItem?.sectionId || null,
            },
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (Math.abs(sanitizedTransaction.subtotal + sanitizedTransaction.tax - sanitizedTransaction.totalAmount) > 0.01) {
          throw new Error('Total amount does not match subtotal + tax');
        }

        await addDoc(collection(db, 'transactions'), sanitizedTransaction);
        toast.success('Transaction recorded successfully');
      } catch (error: any) {
        console.error('Error adding transaction:', error);
        toast.error(`Error recording transaction: ${error.message}`);
        throw error;
      }
    },
    [currentUser]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (!currentUser?.restaurantId) {
        toast.error('Not authenticated. Please log in.');
        throw new Error('Not authenticated');
      }

      const transaction = transactions.find(t => t.id === id);
      if (!transaction || !transaction.createdAt) {
        toast.error('Transaction not found or invalid.');
        throw new Error('Transaction not found or invalid');
      }

      const today = new Date();
      const transactionDate = new Date(transaction.createdAt);
      const isSameDay =
        today.getFullYear() === transactionDate.getFullYear() &&
        today.getMonth() === transactionDate.getMonth() &&
        today.getDate() === transactionDate.getDate();

      if (updates.status && !isSameDay) {
        toast.error('Status changes are only allowed for transactions from today.');
        throw new Error('Status changes restricted to same day');
      }

      try {
        TransactionSchema.partial().parse(updates);
        const transactionRef = doc(db, 'transactions', id);
        await updateDoc(transactionRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        toast.success('Transaction updated successfully');
      } catch (error: any) {
        console.error('Error updating transaction:', error);
        toast.error(`Error updating transaction: ${error.message}`);
        throw error;
      }
    },
    [currentUser, transactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!currentUser?.restaurantId) {
        toast.error('Not authenticated. Please log in.');
        throw new Error('Not authenticated');
      }

      try {
        const transactionRef = doc(db, 'transactions', id);
        await deleteDoc(transactionRef);
        toast.success('Transaction deleted successfully');
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        toast.error(`Error deleting transaction: ${error.message}`);
        throw error;
      }
    },
    [currentUser]
  );

  const getTransactionById = useCallback(
    (id: string) => {
      return transactions.find((transaction) => transaction.id === id);
    },
    [transactions]
  );

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

export default TransactionProvider;