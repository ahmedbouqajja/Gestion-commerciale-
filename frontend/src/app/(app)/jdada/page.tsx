'use client';

import { Generator } from '@/components/generator';
import { useI18n } from '@/lib/i18n';
import { SUBJECTS, LEVELS } from '@/lib/constants';

export default function JdadaPage() {
  const { t } = useI18n();
  return (
    <Generator
      title={t('jdada')}
      description={t('jdadaDesc')}
      endpoint="/generate/jdada"
      fields={[
        { name: 'subject', label: t('subject'), type: 'select', required: true, options: SUBJECTS.map((s) => ({ value: s, label: s })) },
        { name: 'level', label: t('level'), type: 'select', required: true, options: LEVELS.map((l) => ({ value: l, label: l })) },
        { name: 'lesson', label: t('lesson'), type: 'text', required: true, colSpan: 2 },
        { name: 'duration', label: t('duration'), type: 'text', placeholder: 'ex: 50 min' },
      ]}
    />
  );
}
