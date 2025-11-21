import { useCallback, useEffect, useState } from "react";
import api from "../config/api";

export const useConnections = (isAuthenticated: boolean = true) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [totalConnectionsCount, setTotalConnectionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
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
    } catch (_error) {
      setPendingRequestsCount(0);
      setTotalConnectionsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    pendingRequestsCount,
    totalConnectionsCount,
    isLoading,
    refreshCounts: fetchCounts,
  };
};
