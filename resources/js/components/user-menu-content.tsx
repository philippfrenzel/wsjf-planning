import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type SharedData, type User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings, Users } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const page = usePage<SharedData>();
    const tenants = page.props.auth.tenants ?? [];
    const currentTenant = page.props.auth.currentTenant ?? null;

    const hasRoute = (name: string) => {
        try {
            // @ts-ignore - ziggy-js Router when called with no args
            return typeof route === 'function' && (route as any)().has?.(name) === true;
        } catch (_) {
            return false;
        }
    };

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tenants.length > 0 && hasRoute('tenants.index') && (
                <>
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-medium text-neutral-500">Team</DropdownMenuLabel>
                        {currentTenant && (
                            <div className="px-2 pb-1 text-xs text-neutral-600">
                                Aktueller Tenant: <span className="font-semibold">{currentTenant.name}</span>
                            </div>
                        )}
                        {tenants.map((t) => (
                            <DropdownMenuItem
                                key={t.id}
                                className="cursor-pointer"
                                onClick={() => {
                                    if (currentTenant && t.id === currentTenant.id) return;
                                    const url = hasRoute('tenants.switch')
                                        ? // @ts-ignore
                                          route('tenants.switch', t.id)
                                        : `/tenants/${t.id}/switch`;
                                    router.post(url, {}, { preserveScroll: true });
                                    cleanup();
                                }}
                            >
                                <Users className="mr-2" />
                                <span>{t.name}</span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem asChild>
                            <Link
                                className="block w-full"
                                href={hasRoute('tenants.index') ? (route as any)('tenants.index') : '/tenants'}
                                prefetch
                                onClick={cleanup}
                            >
                                <Users className="mr-2" />
                                Tenants verwalten
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                </>
            )}
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" method="post" href={route('logout')} as="button" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
