/**
 * RxDB Provider - Initializes database and replication at app level
 * Wrap your app with this to ensure RxDB is ready before rendering.
 */

'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { type LifeOsDatabase } from './database';

interface RxDBContextValue {
  db: LifeOsDatabase | null;
  isReady: boolean;
  isSyncing: boolean;
  forceSync: () => Promise<void>;
}

const RxDBContext = createContext<RxDBContextValue>({
  db: null,
  isReady: false,
  isSyncing: false,
  forceSync: async () => {},
});

export function useRxDBContext() {
  return useContext(RxDBContext);
}

interface RxDBProviderProps {
  children: ReactNode;
}

export function RxDBProvider({ children }: RxDBProviderProps) {
  const [db, setDb] = useState<LifeOsDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    async function init() {
      try {
        const { getDatabase } = await import('./database');
        const { startReplication } = await import('./replication');

        const database = await getDatabase();
        if (cancelled) return;

        setDb(database);
        // Mark ready immediately - don't block on replication
        setIsReady(true);

        // Start replication in background (fire and forget)
        startReplication(10000).catch((err) =>
          console.error('[RxDB] Replication start error:', err)
        );
      } catch (error) {
        console.error('[RxDB] Initialization error:', error);
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleForceSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const { forceSync } = await import('./replication');
      await forceSync();
    } catch (error) {
      console.error('[RxDB] Force sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <RxDBContext.Provider value={{ db, isReady, isSyncing, forceSync: handleForceSync }}>
      {children}
    </RxDBContext.Provider>
  );
}
