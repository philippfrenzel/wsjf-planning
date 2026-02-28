import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { SharedData } from '@/types';

export function useFlashToast() {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash]);
}
