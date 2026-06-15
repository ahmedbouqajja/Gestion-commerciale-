'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ClipboardCheck, GraduationCap, Dumbbell, Home, Library, FileStack, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { DOC_TYPE_META } from '@/lib/constants';
import type { Stats, DocType } from '@/lib/types';

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const { user, quota } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/documents/stats').then(setStats).catch(() => {});
  }, []);

  const tools = [
    { href: '/jdada', label: t('jdada'), icon: FileText },
    { href: '/controles', label: t('controles'), icon: ClipboardCheck },
    { href: '/examens', label: t('examens'), icon: GraduationCap },
    { href: '/exercices', label: t('exercices'), icon: Dumbbell },
    { href: '/devoirs', label: t('devoirs'), icon: Home },
    { href: '/assistant', label: t('assistant'), icon: Sparkles },
  ];

  const docLabel = (type: DocType) => (lang === 'ar' ? DOC_TYPE_META[type].labelAr : DOC_TYPE_META[type].labelFr);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {t('welcome')}, {user?.name} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">{t('tagline')}</p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileStack className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              <p className="text-sm text-muted-foreground">{t('documentsCreated')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {quota?.limit === null ? t('unlimited') : `${quota?.used ?? 0} / ${quota?.limit ?? 0}`}
              </p>
              <p className="text-sm text-muted-foreground">{t('quotaUsed')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="font-semibold">{user?.plan === 'PRO' ? t('proPlan') : t('freePlan')}</p>
              {user?.plan === 'FREE' && <p className="text-sm text-muted-foreground">{t('upgradePrompt')}</p>}
            </div>
            {user?.plan === 'FREE' && (
              <Link href="/profil">
                <Button size="sm">{t('upgrade')}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accès rapide */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('quickAccess')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                  <tool.icon className="h-7 w-7 text-primary" />
                  <span className="text-sm font-medium">{tool.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Documents récents */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('recentDocuments')}</h2>
          <Link href="/bibliotheque" className="text-sm font-medium text-primary hover:underline">
            {t('bibliotheque')} →
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {stats && stats.recent.length > 0 ? (
              <ul className="divide-y">
                {stats.recent.map((doc) => (
                  <li key={doc.id}>
                    <Link href={`/bibliotheque/${doc.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent">
                      <Badge className={DOC_TYPE_META[doc.type].color}>{docLabel(doc.type)}</Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{doc.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Library className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('libraryEmpty')}</p>
                <Link href="/jdada">
                  <Button size="sm">{t('jdada')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
