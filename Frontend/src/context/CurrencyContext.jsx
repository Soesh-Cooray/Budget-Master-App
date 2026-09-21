import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { currencyList, getCurrencySymbol } from '../api';
import {
  getUserPreferences,
  saveUserPreferences,
  syncUserPreferencesFromBackend,
} from '../services/userPreferences';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    const prefs = getUserPreferences();
    if (prefs?.currency) return prefs.currency;
    return localStorage.getItem('currency') || 'USD';
  });

  const [currencySymbol, setCurrencySymbolState] = useState(() => {
    const prefs = getUserPreferences();
    const code = prefs?.currency || localStorage.getItem('currency') || 'USD';
    const found = currencyList.find((c) => c.code === code);
    return found ? found.symbol : getCurrencySymbol();
  });

  const setCurrency = useCallback((newCode) => {
    setCurrencyState(newCode);
    localStorage.setItem('currency', newCode);
    const found = currencyList.find((c) => c.code === newCode);
    const symbol = found ? found.symbol : '$';
    setCurrencySymbolState(symbol);
    saveUserPreferences({ currency: newCode });
    window.dispatchEvent(new Event('currencyChange'));
  }, []);

  useEffect(() => {
    // Sync user preferences on mount and apply saved currency
    syncUserPreferencesFromBackend().then((prefs) => {
      if (prefs?.currency) {
        setCurrencyState(prefs.currency);
        const found = currencyList.find((c) => c.code === prefs.currency);
        setCurrencySymbolState(found ? found.symbol : '$');
        localStorage.setItem('currency', prefs.currency);
      }
    });

    const handleCurrencyEvent = () => {
      const prefs = getUserPreferences();
      const code = prefs?.currency || localStorage.getItem('currency') || 'USD';
      setCurrencyState(code);
      const found = currencyList.find((c) => c.code === code);
      setCurrencySymbolState(found ? found.symbol : '$');
    };

    const handlePrefUpdate = (e) => {
      if (e.detail?.preferences?.currency) {
        const code = e.detail.preferences.currency;
        setCurrencyState(code);
        const found = currencyList.find((c) => c.code === code);
        setCurrencySymbolState(found ? found.symbol : '$');
        localStorage.setItem('currency', code);
      }
    };

    window.addEventListener('currencyChange', handleCurrencyEvent);
    window.addEventListener('user-preferences-updated', handlePrefUpdate);
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyEvent);
      window.removeEventListener('user-preferences-updated', handlePrefUpdate);
    };
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, currencySymbol, setCurrency, currencyList }}>
      {children}
    </CurrencyContext.Provider>
  );
};
