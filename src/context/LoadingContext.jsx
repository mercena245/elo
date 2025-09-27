"use client";
import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const value = {
    isAppLoading,
    setIsAppLoading,
    isLoginLoading,
    setIsLoginLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};