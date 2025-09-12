import { useState, useCallback } from 'react';

let toastId = 0;

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 7000, // Erreurs restent plus longtemps
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };
};

export default useToast;