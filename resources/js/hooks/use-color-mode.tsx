import { useEffect, useState } from 'react';

/**
 * Returns 'light' or 'dark' based on the current appearance setting.
 * Observes the `dark` class on <html> which is toggled by useAppearance.
 */
export function useColorMode(): 'light' | 'dark' {
    const [mode, setMode] = useState<'light' | 'dark'>(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return mode;
}
