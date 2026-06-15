'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicNav } from '@/components/public-nav';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

export default function TarifsPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const freeFeatures = [t('freeFeature1'), t('freeFeature2'), t('freeFeature3')];
  const proFeatures = [t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4')];

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="container py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('pricing')}</h1>
          <p className="mt-3 text-muted-foreground">{t('tagline')}</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('freePlan')}</CardTitle>
              <div className="mt-2 text-4xl font-extrabold">
                0 DH<span className="text-base font-normal text-muted-foreground"> {t('perMonth')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? '/dashboard' : '/register'} className="mt-6 block">
                <Button variant="outline" className="w-full">
                  {user?.plan === 'FREE' ? t('currentPlan') : t('getStarted')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-primary shadow-lg ring-2 ring-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('proPlan')}</CardTitle>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Pro
                </span>
              </div>
              <div className="mt-2 text-4xl font-extrabold">
                29 DH<span className="text-base font-normal text-muted-foreground"> {t('perMonth')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? '/profil' : '/register'} className="mt-6 block">
                <Button className="w-full">{user?.plan === 'PRO' ? t('currentPlan') : t('choosePlan')}</Button>
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">CMI · Carte bancaire · PayPal</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
