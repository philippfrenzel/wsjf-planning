import deApp from '../locales/de/app.json';
import deWelcome from '../locales/de/welcome.json';
import enApp from '../locales/en/app.json';
import enWelcome from '../locales/en/welcome.json';
import frApp from '../locales/fr/app.json';
import frWelcome from '../locales/fr/welcome.json';
import itApp from '../locales/it/app.json';
import itWelcome from '../locales/it/welcome.json';
import { useLocale } from './use-locale';

const translations = {
    en: { ...enWelcome, ...enApp },
    de: { ...deWelcome, ...deApp },
    fr: { ...frWelcome, ...frApp },
    it: { ...itWelcome, ...itApp },
} as const;

export function useTranslation() {
    const { locale, updateLocale } = useLocale();

    const t = (key: string): any => {
        return (translations as any)[locale]?.[key] ?? (translations as any).en?.[key] ?? key;
    };

    return { t, locale, setLocale: updateLocale } as const;
}
