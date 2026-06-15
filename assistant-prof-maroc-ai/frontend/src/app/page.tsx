'use client';

import Link from 'next/link';
import { FileText, ClipboardCheck, FileDown, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicNav } from '@/components/public-nav';
import { useI18n } from '@/lib/i18n';

export default function LandingPage() {
  const { t } = useI18n();

  const features = [
    { icon: FileText, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: ClipboardCheck, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: FileDown, title: t('feature3Title'), desc: t('feature3Desc') },
  ];

  const tools = [
    { icon: FileText, label: t('jdada') },
    { icon: ClipboardCheck, label: t('controles') },
    { icon: BookOpen, label: t('examens') },
    { icon: Sparkles, label: t('exercices') },
    { icon: MessageSquare, label: t('assistant') },
  ];

  return (
    <div className="min-h-screen">
      <PublicNav />

      <section className="gradient-hero">
        <div className="container flex flex-col items-center py-20 text-center sm:py-28">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" /> {t('appName')}
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t('tagline')}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t('heroCta')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">{t('getStarted')}</Button>
            </Link>
            <Link href="/tarifs">
              <Button size="lg" variant="outline">
                {t('pricing')}
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {tools.map((tool) => (
              <div
                key={tool.label}
                className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm"
              >
                <tool.icon className="h-4 w-4 text-primary" />
                {tool.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-none shadow-sm ring-1 ring-border">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-secondary/40">
        <div className="container flex flex-col items-center py-16 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('heroCta')}</h2>
          <p className="mt-3 text-muted-foreground">{t('freeFeature1')} — {t('free')}</p>
          <Link href="/register" className="mt-6">
            <Button size="lg">{t('getStarted')}</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('appName')}
        </div>
      </footer>
    </div>
  );
}
