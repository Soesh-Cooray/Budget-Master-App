import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyList, getCurrencySymbol } from '../api';

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
    return localStorage.getItem('currency') || 'USD';
  });

  const [currencySymbol, setCurrencySymbolState] = useState(() => {
    return getCurrencySymbol();
  });

  const setCurrency = (newCode) => {
    setCurrencyState(newCode);
    localStorage.setItem('currency', newCode);
    const found = currencyList.find((c) => c.code === newCode);
    const symbol = found ? found.symbol : '$';
    setCurrencySymbolState(symbol);
    window.dispatchEvent(new Event('currencyChange'));
  };

  useEffect(() => {
    const handleCurrencyEvent = () => {
      const saved = localStorage.getItem('currency') || 'USD';
      setCurrencyState(saved);
      const found = currencyList.find((c) => c.code === saved);
      setCurrencySymbolState(found ? found.symbol : '$');
    };

    window.addEventListener('currencyChange', handleCurrencyEvent);
    return () => window.removeEventListener('currencyChange', handleCurrencyEvent);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, currencySymbol, setCurrency, currencyList }}>
      {children}
    </CurrencyContext.Provider>
  );
};
