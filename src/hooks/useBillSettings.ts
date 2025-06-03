// src/hooks/useBillSettings.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Adjust the import path to your Firebase config
import { BillSettings } from '../types/SettingsTypes'; // Adjust the import path if needed

const useBillSettings = () => {
  const [billSettings, setBillSettings] = useState<BillSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'billSettings');

    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBillSettings(docSnap.data() as BillSettings);
          setLoading(false);
        } else {
          setError('Bill settings not found.');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching bill settings:', err);
        setError('Failed to fetch bill settings.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { billSettings, loading, error };
};

export default useBillSettings;