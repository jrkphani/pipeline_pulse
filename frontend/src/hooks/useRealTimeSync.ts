import { useEffect, useState, useRef } from 'react';
import { config } from '../lib/config';

export interface SyncProgress {
  sessionId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: 'full' | 'incremental';
  progress: number; // 0-100
  currentStep: string;
  recordsProcessed: number;
  recordsTotal?: number;
  errorMessage?: string;
  startedAt: string;
  estimatedCompletion?: string;
}

export const useRealTimeSync = (sessionId?: string) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    // Create EventSource connection
    const url = `${config.apiUrl}/api/v1/sync/stream/${sessionId}`;
    const eventSource = new EventSource(url, {
      withCredentials: true, // Include cookies for authentication
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSyncProgress(data);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
        setError('Failed to parse sync data');
      }
    };

    eventSource.onerror = (event) => {
      console.error('SSE error:', event);
      setIsConnected(false);
      setError('Connection lost');
      
      // Close the connection on error
      eventSource.close();
    };

    // Custom event handlers for different message types
    eventSource.addEventListener('sync-started', (event) => {
      const data = JSON.parse(event.data);
      setSyncProgress(data);
    });

    eventSource.addEventListener('sync-progress', (event) => {
      const data = JSON.parse(event.data);
      setSyncProgress(data);
    });

    eventSource.addEventListener('sync-completed', (event) => {
      const data = JSON.parse(event.data);
      setSyncProgress(data);
      // Keep connection open for potential future syncs
    });

    eventSource.addEventListener('sync-failed', (event) => {
      const data = JSON.parse(event.data);
      setSyncProgress(data);
    });

    // Cleanup function
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId]);

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };

  return {
    syncProgress,
    isConnected,
    error,
    disconnect,
  };
};

// Hook for managing multiple sync sessions
export const useSyncManager = () => {
  const [activeSessions, setActiveSessions] = useState<Set<string>>(new Set());
  const [sessionProgresses, setSessionProgresses] = useState<Map<string, SyncProgress>>(new Map());

  const addSession = (sessionId: string) => {
    setActiveSessions(prev => new Set(prev).add(sessionId));
  };

  const removeSession = (sessionId: string) => {
    setActiveSessions(prev => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
    setSessionProgresses(prev => {
      const newMap = new Map(prev);
      newMap.delete(sessionId);
      return newMap;
    });
  };

  const updateSessionProgress = (sessionId: string, progress: SyncProgress) => {
    setSessionProgresses(prev => new Map(prev).set(sessionId, progress));
  };

  const getSessionProgress = (sessionId: string) => {
    return sessionProgresses.get(sessionId);
  };

  const getAllProgresses = () => {
    return Array.from(sessionProgresses.values());
  };

  const hasActiveSyncs = () => {
    return Array.from(sessionProgresses.values()).some(
      progress => progress.status === 'in_progress'
    );
  };

  return {
    activeSessions,
    sessionProgresses,
    addSession,
    removeSession,
    updateSessionProgress,
    getSessionProgress,
    getAllProgresses,
    hasActiveSyncs,
  };
};