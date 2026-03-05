import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Allgemein',
        href: '/tenants/general',
        icon: null,
    },
    {
        title: 'Mitglieder',
        href: '/tenants/members',
        icon: null,
    },
];

export default function TenantLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;
    const page = usePage<SharedData>();
    const tenants = page.props.auth.tenants ?? [];
    const currentTenant = page.props.auth.currentTenant ?? null;

    return (
        <div className="px-4 py-6">
            <Heading title="Organisation" description={currentTenant?.name ?? 'Verwaltung deiner Organisation'} />

            {tenants.length > 1 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    {tenants.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                if (t.id !== currentTenant?.id) {
                                    router.post(route('tenants.switch', t.id), {}, { preserveScroll: true });
                                }
                            }}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                currentTenant?.id === t.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                            )}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': currentPath === item.href,
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
