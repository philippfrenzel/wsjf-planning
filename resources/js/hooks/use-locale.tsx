import { useCallback, useEffect, useState } from 'react';

export type Locale = 'en' | 'de';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function initializeLocale() {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null) as Locale | null;
    const initial = saved || document.documentElement.lang || 'en';
    document.documentElement.lang = initial;
}

export function useLocale() {
    const [locale, setLocale] = useState<Locale>('en');

    const updateLocale = useCallback((lang: Locale) => {
        setLocale(lang);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('locale', lang);
        }
        setCookie('locale', lang);
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang;
        }
    }, []);

    useEffect(() => {
        const saved = (localStorage.getItem('locale') as Locale | null) || (document.documentElement.lang as Locale | null) || 'en';
        setLocale(saved);
    }, []);

    return { locale, updateLocale } as const;
}
