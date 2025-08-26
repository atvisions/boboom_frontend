"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '@/components/ui/Toast';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [toastDuration, setToastDuration] = useState(3000);

  const showToastHandler = (message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3000) => {
    setToastMessage(message);
    setToastType(type);
    setToastDuration(duration);
    setShowToast(true);
  };

  return (
    <ToastContext.Provider value={{ showToast: showToastHandler }}>
      {children}
      
      {/* Global Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={toastDuration}
          onClose={() => setShowToast(false)}
        />
      )}
    </ToastContext.Provider>
  );
};
