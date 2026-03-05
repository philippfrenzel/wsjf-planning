import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Kanban, LayoutGrid, ListChecks, Map, Menu, Route, Shirt, FolderKanban, Users, Zap } from 'lucide-react';
import AppLogoIcon from './app-logo-icon';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = page.props as any;
    const hasProjects = props.hasProjects ?? false;
    const hasFeatures = props.hasFeatures ?? false;
    const getInitials = useInitials();

    const navItems = [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
        { title: 'Projekte', href: '/projects', icon: FolderKanban },
        hasProjects && { title: 'Features', href: '/features', icon: Shirt },
        hasProjects && { title: 'Board', href: '/features/board', icon: Kanban },
        hasFeatures && { title: 'WSJF', href: '/plannings', icon: Route },
        { title: 'Teams', href: '/teams', icon: Users },
        { title: 'Skills', href: '/skills', icon: Zap },
        { title: 'DoR/DoD', href: '/definitions', icon: ListChecks },
        hasProjects && { title: 'Roadmap', href: '/roadmap', icon: Map },
    ].filter(Boolean) as { title: string; href: string; icon: React.ElementType }[];

    const isActive = (href: string) => page.url.startsWith(href.split('?')[0]);

    return (
        <header className="sticky top-0 z-40 bg-[#0f172a] border-b border-slate-800">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

                {/* Mobile hamburger */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-[#0f172a] border-slate-800 w-64">
                            <SheetTitle className="sr-only">Navigation</SheetTitle>
                            <SheetHeader className="mb-6">
                                <div className="flex items-center gap-2 mt-2">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-indigo-400" />
                                    <span className="text-white font-semibold">WSJF Planning</span>
                                </div>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            isActive(item.href)
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Logo */}
                <Link href="/dashboard" prefetch className="flex items-center gap-2.5 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
                        <AppLogoIcon className="h-5 w-5 fill-current text-white" />
                    </div>
                    <span className="hidden sm:inline text-white font-semibold text-sm">WSJF Planning</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-1 ml-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive(item.href)
                                    ? 'text-white bg-slate-800'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>

                {/* Right side */}
                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-800">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={auth.user.avatar || undefined} alt={auth.user.name} />
                                    <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Breadcrumb sub-bar */}
            {breadcrumbs.length > 1 && (
                <div className="border-t border-slate-800 bg-[#0f172a]/90 backdrop-blur">
                    <div className="mx-auto flex h-10 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-2">
                                {i > 0 && <span>/</span>}
                                {i === breadcrumbs.length - 1 ? (
                                    <span className="text-slate-300">{crumb.title}</span>
                                ) : (
                                    <Link href={crumb.href} className="hover:text-white transition-colors">{crumb.title}</Link>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}

