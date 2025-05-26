import React, { createContext, useContext, useState } from 'react';
import { Cart, CartItem, MenuItem } from '../types';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';
import { toast } from 'react-toastify';
import { generateThermalBill } from '../utils/pdf';

interface CartContextType {
  cart: Cart;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerInfo: (customerName?: string, customerPhone?: string, tableNumber?: string) => void;
  checkout: (paymentMethod: 'cash' | 'card' | 'other') => Promise<void>;
  generateBill: () => Promise<string>;
  billText: string | null;
  copyBillText: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalAmount: 0,
    customerName: undefined,
    customerPhone: undefined,
    tableNumber: undefined,
  });
  const [billText, setBillText] = useState<string | null>(null);

  const { currentUser } = useAuth();
  const { addTransaction } = useTransactions();

  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce(
      (total, item) => total + item.quantity * item.menuItem.price,
      0
    );
  };

  const addToCart = (item: MenuItem, quantity = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (cartItem) => cartItem.menuItem.id === item.id
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
      } else {
        updatedItems = [...prevCart.items, { menuItem: item, quantity }];
      }

      return {
        ...prevCart,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems),
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.items.filter(
        (item) => item.menuItem.id !== itemId
      );
      return {
        ...prevCart,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems),
      };
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) => {
        if (item.menuItem.id === itemId) {
          return { ...item, quantity };
        }
        return item;
      });

      return {
        ...prevCart,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems),
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalAmount: 0,
      customerName: undefined,
      customerPhone: undefined,
      tableNumber: undefined,
    });
    setBillText(null);
  };

  const setCustomerInfo = (customerName?: string, customerPhone?: string, tableNumber?: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      customerName: customerName?.trim(),
      customerPhone: customerPhone?.trim(),
      tableNumber: tableNumber?.trim(),
    }));
  };

  const checkout = async (paymentMethod: 'cash' | 'card' | 'other') => {
    if (!currentUser) {
      toast.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      throw new Error('Cart is empty');
    }

    try {
      const taxRate = 0.18; // 18% GST
      const subtotal = cart.totalAmount;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      const transactionId = await addTransaction({
        items: cart.items,
        totalAmount: total,
        subtotal,
        tax,
        paymentMethod,
        status: 'completed',
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        tableNumber: cart.tableNumber,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        restaurantId: currentUser.restaurantId,
      });

      const bill = generateThermalBill({
        id: transactionId,
        items: cart.items,
        subtotal,
        tax,
        total,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        tableNumber: cart.tableNumber,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        paymentMethod,
        createdAt: new Date().toISOString(),
      });

      setBillText(bill);
      toast.success('Checkout completed. Copy the bill text to print on your thermal printer.');
      clearCart();
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(`Checkout failed: ${error.message}`);
      throw error;
    }
  };

  const generateBill = async () => {
    if (!currentUser || cart.items.length === 0) {
      toast.error('Cannot generate bill: Cart is empty or user not authenticated');
      throw new Error('Cannot generate bill: Cart is empty or user not authenticated');
    }

    try {
      const taxRate = 0.18; // 18% GST
      const subtotal = cart.totalAmount;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      const transactionId = await addTransaction({
        items: cart.items,
        totalAmount: total,
        subtotal,
        tax,
        paymentMethod: 'card', // Default for generating bill without checkout
        status: 'completed',
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        tableNumber: cart.tableNumber,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        restaurantId: currentUser.restaurantId,
      });

      const bill = generateThermalBill({
        id: transactionId,
        items: cart.items,
        subtotal,
        tax,
        total,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        tableNumber: cart.tableNumber,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        paymentMethod: 'card',
        createdAt: new Date().toISOString(),
      });

      setBillText(bill);
      toast.success('Bill generated. Copy the bill text to print on your thermal printer.');
      return bill;
    } catch (error: any) {
      console.error('Error generating bill:', error);
      toast.error(`Failed to generate bill: ${error.message}`);
      throw error;
    }
  };

  const copyBillText = () => {
    if (!billText) {
      toast.error('No bill text available to copy');
      return;
    }
    navigator.clipboard.writeText(billText).then(() => {
      toast.success('Bill text copied to clipboard');
    }).catch((err) => {
      console.error('Failed to copy bill text:', err);
      toast.error('Failed to copy bill text');
    });
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCustomerInfo,
    checkout,
    generateBill,
    billText,
    copyBillText,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};