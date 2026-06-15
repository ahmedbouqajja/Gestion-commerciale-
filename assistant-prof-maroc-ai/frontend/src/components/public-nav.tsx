'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LangSwitcher } from '@/components/lang-switcher';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

export function PublicNav() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{t('appName')}</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/tarifs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t('pricing')}
          </Link>
          <LangSwitcher />
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">{t('dashboard')}</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t('getStarted')}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
