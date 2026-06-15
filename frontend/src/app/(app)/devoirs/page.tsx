'use client';

import { Generator } from '@/components/generator';
import { useI18n } from '@/lib/i18n';
import { SUBJECTS, LEVELS } from '@/lib/constants';

export default function DevoirsPage() {
  const { t } = useI18n();
  return (
    <Generator
      title={t('devoirs')}
      description={t('devoirsDesc')}
      endpoint="/generate/devoir"
      fields={[
        { name: 'subject', label: t('subject'), type: 'select', required: true, options: SUBJECTS.map((s) => ({ value: s, label: s })) },
        { name: 'level', label: t('level'), type: 'select', required: true, options: LEVELS.map((l) => ({ value: l, label: l })) },
        { name: 'topic', label: t('topic'), type: 'text', required: true, colSpan: 2, placeholder: 'ex: les verbes du 1er groupe' },
      ]}
    />
  );
}
