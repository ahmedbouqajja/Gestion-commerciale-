'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn('inline-flex rounded-md border bg-background p-0.5 text-sm', className)}>
      <button
        onClick={() => setLang('fr')}
        className={cn('rounded px-2.5 py-1 font-medium', lang === 'fr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
      >
        FR
      </button>
      <button
        onClick={() => setLang('ar')}
        className={cn('rounded px-2.5 py-1 font-medium', lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
      >
        ع
      </button>
    </div>
  );
}
