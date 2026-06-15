'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  GraduationCap,
  Dumbbell,
  Home,
  Library,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { LangSwitcher } from '@/components/lang-switcher';

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/jdada', label: t('jdada'), icon: FileText },
    { href: '/controles', label: t('controles'), icon: ClipboardCheck },
    { href: '/examens', label: t('examens'), icon: GraduationCap },
    { href: '/exercices', label: t('exercices'), icon: Dumbbell },
    { href: '/devoirs', label: t('devoirs'), icon: Home },
    { href: '/bibliotheque', label: t('bibliotheque'), icon: Library },
    { href: '/assistant', label: t('assistant'), icon: MessageSquare },
    { href: '/profil', label: t('profil'), icon: User },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-full flex-col border-e bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-5 font-bold">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-sm leading-tight">{t('appName')}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t p-3">
        <LangSwitcher className="w-full justify-center" />
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.plan === 'PRO' ? t('proPlan') : t('freePlan')}
            </p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive" title={t('logout')}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
