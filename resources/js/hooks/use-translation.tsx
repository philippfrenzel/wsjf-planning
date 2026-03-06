import deApp from '../locales/de/app.json';
import deDocs from '../locales/de/docs.json';
import deWelcome from '../locales/de/welcome.json';
import enApp from '../locales/en/app.json';
import enDocs from '../locales/en/docs.json';
import enWelcome from '../locales/en/welcome.json';
import frApp from '../locales/fr/app.json';
import frDocs from '../locales/fr/docs.json';
import frWelcome from '../locales/fr/welcome.json';
import itApp from '../locales/it/app.json';
import itDocs from '../locales/it/docs.json';
import itWelcome from '../locales/it/welcome.json';
import { useLocale } from './use-locale';

const translations = {
    en: { ...enWelcome, ...enApp, ...enDocs },
    de: { ...deWelcome, ...deApp, ...deDocs },
    fr: { ...frWelcome, ...frApp, ...frDocs },
    it: { ...itWelcome, ...itApp, ...itDocs },
} as const;

export function useTranslation() {
    const { locale, updateLocale } = useLocale();

    const t = (key: string): any => {
        return (translations as any)[locale]?.[key] ?? (translations as any).en?.[key] ?? key;
    };

    return { t, locale, setLocale: updateLocale } as const;
}
