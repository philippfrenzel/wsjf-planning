import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, BarChart3 as Donut, Route, Shirt, Shield } from 'lucide-react';
import AppLogo from './app-logo';

interface AppSidebarProps {
    hasProjects: boolean;
    firstPlanningId?: number; // oder firstProjectId, je nach Routing
}

export function AppSidebar({ hasProjects, firstPlanningId }: AppSidebarProps) {
    // Auth-Objekt sicher extrahieren
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = (usePage().props as any)?.auth;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Projekte',
            href: '/projects',
            icon: Donut,
        },
        hasProjects && {
            title: 'WSJF Verwaltung',
            href: '/plannings?project_id=' + (firstPlanningId || ''),
            icon: Route,
        },
        {
            title: 'Features',
            href: '/features',
            icon: Shirt,
        },
        // Admin-Link nur für Philipp
        auth?.user?.email === 'philipp@frenzel.net' && {
            title: 'Plannings Admin',
            href: '/plannings/admin',
            icon: Shield,
        },
    ].filter(Boolean) as NavItem[];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
