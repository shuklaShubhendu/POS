import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Cart, CartItem, MenuItem } from '../types';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';
import { generateThermalBill } from '../utils/pdf';
import { BillSettings, Transaction } from '../pages/admin/Settings';
import PrintReceipt from '../pages/admin/PrintReceipt';

interface CartContextType {
  cart: Cart;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerInfo: (customerName?: string, customerPhone?: string, tableNumber?: string) => void;
  checkout: (paymentMethod: 'cash' | 'card' | 'other') => Promise<void>;
  generateBill: (useThermal?: boolean) => Promise<string | JSX.Element>;
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
  const [billSettings, setBillSettings] = useState<BillSettings>({
    restaurantName: 'ezPay Restaurant',
    address: '123 Main Street, City, State 12345',
    phone: '(555) 123-4567',
    taxRate: 10,
    includeLogoOnBill: false,
    footerText: 'Thank you for dining with us!',
    showItemizedTax: true,
    showServerName: true,
    billFontSize: 7,
    logoUrl: null,
    qrCodeUrl: null,
    showUpiQrCode: false,
  });

  const { currentUser } = useAuth();
  const { addTransaction } = useTransactions();

  // Load bill settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('billSettings');
      if (savedSettings) {
        setBillSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load bill settings:', error);
    }
  }, []);

  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce(
      (total, item) => total + item.quantity * (item.menuItem.price ?? 0),
      0
    );
  };

  const addToCart = (item: MenuItem, quantity = 1) => {
    if (typeof item.price !== 'number' || isNaN(item.price)) {
      console.error(`Invalid price for item ${item.name}: ${item.price}`);
      toast.error(`Cannot add ${item.name} to cart: Invalid price`);
      return;
    }

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
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      tableNumber: tableNumber?.trim() || undefined,
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
      const subtotal = cart.totalAmount;
      const tax = subtotal * (billSettings.taxRate / 100);
      const total = subtotal + tax;

      // Fixed: Include all required fields for transaction validation
      const sanitizedItems = cart.items.map(item => ({
        menuItem: {
          id: item.menuItem.id, // This was missing!
          name: item.menuItem.name,
          price: item.menuItem.price ?? 0,
          sectionId: item.menuItem.sectionId || undefined,
          section: item.menuItem.section || undefined,
        },
        quantity: item.quantity,
        price: item.menuItem.price ?? 0, // This was also missing!
      }));

      // Validate that all items have required fields
      if (sanitizedItems.some(item => !item.menuItem.id || item.menuItem.price === 0)) {
        console.error('Invalid items found:', sanitizedItems);
        toast.error('Some items have invalid data. Please refresh and try again.');
        throw new Error('Invalid item data');
      }

      const transactionData = {
        items: sanitizedItems,
        totalAmount: total,
        subtotal,
        tax,
        paymentMethod,
        status: 'completed' as const,
        customerName: cart.customerName ?? null,
        customerPhone: cart.customerPhone ?? null,
        tableNumber: cart.tableNumber ?? null,
        employeeName: currentUser.name,
        restaurantId: currentUser.restaurantId,
      };

      await addTransaction(transactionData);

      const bill = generateThermalBill({
        id: 'temp-id', // This will be replaced by the actual transaction ID
        items: sanitizedItems,
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
      toast.success('Checkout completed. Copy the bill text for thermal printer or print receipt.');
      clearCart();
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(`Checkout failed: ${error.message}`);
      throw error;
    }
  };

  const generateBill = async (useThermal: boolean = true) => {
    if (!currentUser || cart.items.length === 0) {
      toast.error('Cannot generate bill: Cart is empty or user not authenticated');
      throw new Error('Cannot generate bill: Cart is empty or user not authenticated');
    }

    try {
      const subtotal = cart.totalAmount;
      const tax = subtotal * (billSettings.taxRate / 100);
      const total = subtotal + tax;

      // Fixed: Include all required fields for transaction validation
      const sanitizedItems = cart.items.map(item => ({
        menuItem: {
          id: item.menuItem.id, // This was missing!
          name: item.menuItem.name,
          price: item.menuItem.price ?? 0,
          sectionId: item.menuItem.sectionId || undefined,
          section: item.menuItem.section || undefined,
        },
        quantity: item.quantity,
        price: item.menuItem.price ?? 0, // This was also missing!
      }));

      // Validate that all items have required fields
      if (sanitizedItems.some(item => !item.menuItem.id || item.menuItem.price === 0)) {
        console.error('Invalid items found:', sanitizedItems);
        toast.error('Some items have invalid data. Please refresh and try again.');
        throw new Error('Invalid item data');
      }

      const transactionData = {
        items: sanitizedItems,
        totalAmount: total,
        subtotal,
        tax,
        paymentMethod: 'card' as const,
        status: 'completed' as const,
        customerName: cart.customerName ?? null,
        customerPhone: cart.customerPhone ?? null,
        tableNumber: cart.tableNumber ?? null,
        employeeName: currentUser.name,
        restaurantId: currentUser.restaurantId,
      };

      const transactionId = await addTransaction(transactionData);

      if (useThermal) {
        const bill = generateThermalBill({
          id: transactionId,
          items: sanitizedItems,
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
      } else {
        const transaction: Transaction = {
          id: transactionId,
          items: sanitizedItems,
          totalAmount: total,
          employeeName: cart.customerName || currentUser.name || 'Guest',
          tableNumber: cart.tableNumber || 'N/A',
        };
        return <PrintReceipt settings={billSettings} transaction={transaction} />;
      }
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