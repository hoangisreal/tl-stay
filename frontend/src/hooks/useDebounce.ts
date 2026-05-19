import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` ms of inactivity.  Useful for preventing rapid-fire API
 * calls when a dependency changes in quick succession.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
