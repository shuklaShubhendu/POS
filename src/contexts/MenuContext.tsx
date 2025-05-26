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
  serverTimestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { MenuItem, MenuSection } from '../types';

interface MenuContextType {
  menuItems: MenuItem[];
  menuSections: MenuSection[];
  addMenuItem: (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addMenuSection: (name: string) => void;
  updateMenuSection: (id: string, name: string) => void;
  deleteMenuSection: (id: string) => void;
  getMenuItemsBySection: (sectionId: string) => MenuItem[];
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.restaurantId) return;

    // Subscribe to menu sections
    const sectionsQuery = query(
      collection(db, COLLECTIONS.MENU_SECTIONS),
      where('restaurantId', '==', currentUser.restaurantId),
      orderBy('orderIndex')
    );

    const unsubscribeSections = onSnapshot(sectionsQuery, (snapshot) => {
      const sectionsData: MenuSection[] = [];
      snapshot.forEach((doc) => {
        sectionsData.push({ id: doc.id, ...doc.data() } as MenuSection);
      });
      setMenuSections(sectionsData);
    });

    // Subscribe to menu items
    const itemsQuery = query(
      collection(db, COLLECTIONS.MENU_ITEMS),
      where('restaurantId', '==', currentUser.restaurantId)
    );

    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsData: MenuItem[] = [];
      snapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(itemsData);
    });

    return () => {
      unsubscribeSections();
      unsubscribeItems();
    };
  }, [currentUser]);

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.restaurantId) throw new Error('Not authenticated');

    try {
      await addDoc(collection(db, COLLECTIONS.MENU_ITEMS), {
        ...item,
        restaurantId: currentUser.restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    if (!currentUser?.restaurantId) throw new Error('Not authenticated');

    try {
      const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, id);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!currentUser?.restaurantId) throw new Error('Not authenticated');

    try {
      const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  };

  const addMenuSection = async (name: string) => {
    if (!currentUser?.restaurantId) throw new Error('Not authenticated');

    try {
      await addDoc(collection(db, COLLECTIONS.MENU_SECTIONS), {
        name,
        restaurantId: currentUser.restaurantId,
        orderIndex: menuSections.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding menu section:', error);
      throw error;
    }
  };

  const updateMenuSection = async (id: string, name: string) => {
    if (!currentUser?.restaurantId) throw new Error('Not authenticated');

    try {
      const sectionRef = doc(db, COLLECTIONS.MENU_SECTIONS, id);
      await updateDoc(sectionRef, {
        name,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating menu section:', error);
      throw error;
    }
  };

  const deleteMenuSection = async (id: string) => {
    if (!currentUser?.restaurantId) throw new Error('Not authenticated');

    try {
      // First delete all menu items in this section
      const itemsQuery = query(
        collection(db, COLLECTIONS.MENU_ITEMS),
        where('sectionId', '==', id)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      const deletePromises = itemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Then delete the section
      const sectionRef = doc(db, COLLECTIONS.MENU_SECTIONS, id);
      await deleteDoc(sectionRef);
    } catch (error) {
      console.error('Error deleting menu section:', error);
      throw error;
    }
  };

  const getMenuItemsBySection = (sectionId: string) => {
    return menuItems.filter((item) => item.sectionId === sectionId);
  };

  const value = {
    menuItems,
    menuSections,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addMenuSection,
    updateMenuSection,
    deleteMenuSection,
    getMenuItemsBySection,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};