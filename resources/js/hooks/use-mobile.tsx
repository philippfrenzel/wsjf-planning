import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

function mediaQueryListener(callback: (event: MediaQueryListEvent) => void) {
    mql.addEventListener('change', callback);
    return () => {
        mql.removeEventListener('change', callback);
    };
}

export function useIsMobile() {
    return useSyncExternalStore(
        mediaQueryListener, // React won't resubscribe for as long as you pass the same function
        () => window.innerWidth < MOBILE_BREAKPOINT, // How to get the value on the client
        () => false, // How to get the value on the server
    );
}
