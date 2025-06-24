import { useState, useEffect } from 'react';
import { Connection } from '../types';
import api from '../config/api';

export const useConnections = (isAuthenticated: boolean = true) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendingRequestsCount = async () => {
    if (!isAuthenticated) {
      setPendingRequestsCount(0);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await api.connections.getPendingRequests();
      setPendingRequestsCount(response.data.length);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequestsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequestsCount();
  }, [isAuthenticated]);

  return {
    pendingRequestsCount,
    isLoading,
    refreshPendingRequests: fetchPendingRequestsCount
  };
}; 