import { useEffect, useState } from 'react';

// A small hook to persist a state value to localStorage.
// Works safely with SSR by avoiding window access during initialization.
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const stored = window.localStorage.getItem(key);
            return stored !== null ? (JSON.parse(stored) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore write errors (e.g., private mode full storage)
        }
    }, [key, value]);

    return [value, setValue] as const;
}
