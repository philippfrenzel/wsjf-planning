import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createContext, useCallback, useContext, useState } from 'react';

interface ConfirmOptions {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

interface ConfirmDialogContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirm() {
    const ctx = useContext(ConfirmDialogContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return ctx.confirm;
}

export function ConfirmDialogProvider({ children }: { children?: React.ReactNode }) {
    const [state, setState] = useState<{
        open: boolean;
        options: ConfirmOptions;
        resolve: (v: boolean) => void;
    } | null>(null);

    const confirm = useCallback(
        (options: ConfirmOptions) =>
            new Promise<boolean>((resolve) => {
                setState({ open: true, options, resolve });
            }),
        [],
    );

    const handleAction = (value: boolean) => {
        state?.resolve(value);
        setState(null);
    };

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}
            {state && (
                <AlertDialog open={state.open} onOpenChange={(open) => !open && handleAction(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{state.options.title}</AlertDialogTitle>
                            <AlertDialogDescription>{state.options.description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => handleAction(false)}>
                                {state.options.cancelLabel ?? 'Abbrechen'}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAction(true)}>
                                {state.options.confirmLabel ?? 'Bestätigen'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </ConfirmDialogContext.Provider>
    );
}
