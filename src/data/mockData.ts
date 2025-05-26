import { MenuItem, MenuSection, Transaction, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'c0a80121-1234-4321-9876-123456789012',
    name: 'Admin User',
    email: 'admin@restaurant.com',
    password: 'admin123', // In a real app, this would be hashed
    role: 'admin',
    createdAt: '2023-01-15T10:00:00Z',
    lastLogin: '2023-05-01T08:30:00Z',
  },
  {
    id: 'c0a80121-5678-8765-4321-987654321098',
    name: 'Manager User',
    email: 'manager@restaurant.com',
    password: 'manager123',
    role: 'manager',
    createdAt: '2023-02-20T14:30:00Z',
    lastLogin: '2023-04-28T09:15:00Z',
  },
  {
    id: 'c0a80121-9012-3456-7890-456789012345',
    name: 'Employee User',
    email: 'employee@restaurant.com',
    password: 'employee123',
    role: 'employee',
    createdAt: '2023-03-10T11:45:00Z',
    lastLogin: '2023-05-02T10:00:00Z',
  },
];

// Mock Menu Sections
export const mockMenuSections: MenuSection[] = [
  {
    id: 'c0a80121-abcd-efgh-ijkl-123456789abc',
    name: 'Starters',
    orderIndex: 0,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-bcde-fghi-jklm-234567890bcd',
    name: 'Main Course',
    orderIndex: 1,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-cdef-ghij-klmn-345678901cde',
    name: 'Desserts',
    orderIndex: 2,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-defg-hijk-lmno-456789012def',
    name: 'Drinks',
    orderIndex: 3,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
];

// Mock Menu Items
export const mockMenuItems: MenuItem[] = [
  {
    id: 'c0a80121-1111-2222-3333-444455556666',
    name: 'Garlic Bread',
    description: 'Freshly baked bread with garlic butter',
    price: 199,
    image: 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-abcd-efgh-ijkl-123456789abc',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-2222-3333-4444-555566667777',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
    price: 299,
    image: 'https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-abcd-efgh-ijkl-123456789abc',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-3333-4444-5555-666677778888',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato, mozzarella, and basil',
    price: 499,
    image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-bcde-fghi-jklm-234567890bcd',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-4444-5555-6666-777788889999',
    name: 'Spaghetti Bolognese',
    description: 'Spaghetti with rich meat sauce',
    price: 599,
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-bcde-fghi-jklm-234567890bcd',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-5555-6666-7777-888899990000',
    name: 'Grilled Chicken',
    description: 'Grilled chicken breast with vegetables',
    price: 699,
    image: 'https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-bcde-fghi-jklm-234567890bcd',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-6666-7777-8888-999900001111',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee and mascarpone',
    price: 299,
    image: 'https://images.pexels.com/photos/6133303/pexels-photo-6133303.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-cdef-ghij-klmn-345678901cde',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-7777-8888-9999-000011112222',
    name: 'Chocolate Brownie',
    description: 'Warm chocolate brownie with vanilla ice cream',
    price: 249,
    image: 'https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-cdef-ghij-klmn-345678901cde',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-8888-9999-0000-111122223333',
    name: 'Coca-Cola',
    description: 'Classic soda drink',
    price: 99,
    image: 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-defg-hijk-lmno-456789012def',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-9999-0000-1111-222233334444',
    name: 'Iced Tea',
    description: 'Refreshing iced tea',
    price: 129,
    image: 'https://images.pexels.com/photos/792613/pexels-photo-792613.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-defg-hijk-lmno-456789012def',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
  {
    id: 'c0a80121-0000-1111-2222-333344445555',
    name: 'Coffee',
    description: 'Freshly brewed coffee',
    price: 129,
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
    available: true,
    sectionId: 'c0a80121-defg-hijk-lmno-456789012def',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
  },
];

// Generate a series of mock transactions
export const mockTransactions: Transaction[] = Array.from({ length: 50 }, (_, i) => {
  // Pick some random items for this transaction
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = Array.from({ length: numItems }, () => {
    const randomItemIndex = Math.floor(Math.random() * mockMenuItems.length);
    const menuItem = mockMenuItems[randomItemIndex];
    const quantity = Math.floor(Math.random() * 3) + 1;
    
    return {
      menuItem,
      quantity,
      notes: Math.random() > 0.7 ? 'Special instructions' : undefined,
    };
  });
  
  // Calculate total amount for this transaction
  const totalAmount = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  
  // Generate random date within the last 60 days
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 60));
  const createdAt = date.toISOString();
  
  // Randomly pick an employee
  const employee = mockUsers[Math.floor(Math.random() * mockUsers.length)];
  
  return {
    id: uuidv4(),
    items,
    totalAmount,
    paymentMethod: Math.random() > 0.7 ? 'card' : 'cash',
    status: 'completed',
    customerName: Math.random() > 0.5 ? 'Walk-in Customer' : undefined,
    tableNumber: Math.random() > 0.5 ? `${Math.floor(Math.random() * 20) + 1}` : undefined,
    employeeId: employee.id,
    employeeName: employee.name,
    createdAt,
    updatedAt: createdAt,
  } as Transaction;
});