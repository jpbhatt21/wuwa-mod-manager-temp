import { useCallback, useRef } from 'react';

interface FileOperation {
  id: string;
  operation: () => Promise<void>;
  priority: number;
}

/**
 * Hook for managing async file operations to prevent UI blocking
 */
export function useAsyncFileOperations() {
  const operationQueueRef = useRef<FileOperation[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || operationQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      // Sort by priority (higher number = higher priority)
      operationQueueRef.current.sort((a, b) => b.priority - a.priority);
      
      const operation = operationQueueRef.current.shift();
      if (operation) {
        await operation.operation();
      }
    } catch (error) {
      console.error('File operation failed:', error);
    } finally {
      isProcessingRef.current = false;
      
      // Process next operation if queue is not empty
      if (operationQueueRef.current.length > 0) {
        // Use setTimeout to prevent blocking UI
        setTimeout(processQueue, 0);
      }
    }
  }, []);

  const queueOperation = useCallback(
    (operation: () => Promise<void>, priority: number = 0) => {
      const id = Date.now().toString() + Math.random().toString(36);
      operationQueueRef.current.push({ id, operation, priority });
      processQueue();
      return id;
    },
    [processQueue]
  );

  const clearQueue = useCallback(() => {
    operationQueueRef.current = [];
  }, []);

  return {
    queueOperation,
    clearQueue,
    isProcessing: isProcessingRef.current,
    queueLength: operationQueueRef.current.length,
  };
}