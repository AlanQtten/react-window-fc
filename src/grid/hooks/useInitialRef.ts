import { useMemo, useRef } from 'react';

export function useInitialRef<T>(initialFn) {
  const memoValue = useMemo<T>(() => {
    return initialFn();
  }, []);
  return useRef<T>(memoValue);
}
