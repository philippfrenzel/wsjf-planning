import de from '../locales/de/welcome.json';
import en from '../locales/en/welcome.json';
import { useLocale } from './use-locale';

const translations = { en, de } as const;

export function useTranslation() {
    const { locale, updateLocale } = useLocale();

    const t = (key: string): any => {
        return (translations as any)[locale]?.[key] ?? (translations as any).en?.[key] ?? key;
    };

    return { t, locale, setLocale: updateLocale } as const;
}
