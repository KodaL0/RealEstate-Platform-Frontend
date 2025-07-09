import { useState, useEffect } from 'react';
import { Connection } from '../types';
import api from '../config/api';

export const useConnections = (isAuthenticated: boolean = true) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [totalConnectionsCount, setTotalConnectionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCounts = async () => {
    if (!isAuthenticated) {
      setPendingRequestsCount(0);
      setTotalConnectionsCount(0);
      return;
    }
    try {
      setIsLoading(true);
      const [pendingRes, connectionsRes] = await Promise.all([
        api.connections.getPendingRequests(),
        api.connections.getMyConnections(),
      ]);
      setPendingRequestsCount(pendingRes.data.length);
      setTotalConnectionsCount(connectionsRes.data.length);
    } catch (error) {
      setPendingRequestsCount(0);
      setTotalConnectionsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [isAuthenticated]);

  return {
    pendingRequestsCount,
    totalConnectionsCount,
    isLoading,
    refreshCounts: fetchCounts,
  };
}; 