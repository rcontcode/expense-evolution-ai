import { useState, useEffect, useCallback } from 'react';

export interface OfflineQueueItem {
  id: string;
  dataUrl: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'error';
  retryCount: number;
  metadata?: {
    quickCategory?: string;
    quickClient?: string;
    quickProject?: string;
  };
}

const DB_NAME = 'mobile-capture-offline';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from IndexedDB on mount
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        setQueue(request.result || []);
      };
    } catch (e) {
      console.error('Error loading offline queue:', e);
    }
  };

  const addToQueue = useCallback(async (
    dataUrl: string,
    metadata?: OfflineQueueItem['metadata']
  ): Promise<string> => {
    const item: OfflineQueueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      metadata,
    };

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.add(item);
      
      setQueue(prev => [...prev, item]);
      return item.id;
    } catch (e) {
      console.error('Error adding to offline queue:', e);
      throw e;
    }
  }, []);

  const removeFromQueue = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);
      
      setQueue(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('Error removing from offline queue:', e);
    }
  }, []);

  const updateItemStatus = useCallback(async (
    id: string, 
    status: OfflineQueueItem['status'],
    incrementRetry: boolean = false
  ) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.status = status;
          if (incrementRetry) item.retryCount++;
          store.put(item);
          setQueue(prev => prev.map(i => i.id === id ? item : i));
        }
      };
    } catch (e) {
      console.error('Error updating queue item:', e);
    }
  }, []);

  const clearQueue = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      setQueue([]);
    } catch (e) {
      console.error('Error clearing offline queue:', e);
    }
  }, []);

  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const errorCount = queue.filter(i => i.status === 'error').length;
  const syncingCount = queue.filter(i => i.status === 'syncing').length;

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateItemStatus,
    clearQueue,
    loadQueue,
    isSyncing,
    setIsSyncing,
    pendingCount,
    errorCount,
    syncingCount,
    hasItems: queue.length > 0,
  };
}
