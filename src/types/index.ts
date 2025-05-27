export type UserRole = 'superadmin' | 'admin' | 'manager' | 'employee';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId: string;
  createdAt: string;
  authId: string;
}

export interface Customer {
  id: string;
  restaurantId: string;
  name: string;
  email?: string;
  phone?: string;
  discountRate: number;
  totalSpent: number;
  loyaltyPoints: number;
  categoryId?: string;
  category?: CustomerCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCategory {
  id: string;
  restaurantId: string;
  name: string;
  minSpent: number;
  discountRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSection {
  id: string;
  restaurantId: string;
  name: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  price?: number; // Optional, as it might be derived from menuItem.price
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
}

export interface Transaction {
  id: string;
  restaurantId: string;
  items: CartItem[];
  totalAmount: number;
  subtotal: number; // Added to match CartContext.tsx
  tax: number; // Added to match CartContext.tsx
  paymentMethod: 'cash' | 'card' | 'other';
  status: 'completed' | 'refunded' | 'cancelled';
  customerId?: string;
  customerName: string | null; // Aligned with sanitization in TransactionContext.tsx
  customerPhone: string | null; // Aligned with sanitization in TransactionContext.tsx
  tableNumber: string | null; // Aligned with sanitization in TransactionContext.tsx
  employeeId: string;
  employeeName: string;
  createdAt: Date | null; // Already updated to Date | null
  updatedAt: Date | null; // Already updated to Date | null
}

export interface BillSettings {
  restaurantName: string;
  address: string;
  phone: string;
  taxRate: number;
  includeLogoOnBill: boolean;
  footerText: string;
  showItemizedTax: boolean;
  showServerName: boolean;
  currency: string;
}

export interface SalesData {
  dailySales: number[];
  monthlySales: number[];
  topSellingItems: {
    name: string;
    count: number;
    revenue: number;
  }[];
  salesBySection: {
    section: string;
    revenue: number;
    count: number;
  }[];
}