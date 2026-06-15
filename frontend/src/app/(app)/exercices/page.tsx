'use client';

import { Generator } from '@/components/generator';
import { useI18n } from '@/lib/i18n';
import { SUBJECTS, LEVELS } from '@/lib/constants';

export default function ExercicesPage() {
  const { t } = useI18n();
  return (
    <Generator
      title={t('exercices')}
      description={t('exercicesDesc')}
      endpoint="/generate/exercices"
      fields={[
        { name: 'subject', label: t('subject'), type: 'select', required: true, options: SUBJECTS.map((s) => ({ value: s, label: s })) },
        { name: 'level', label: t('level'), type: 'select', required: true, options: LEVELS.map((l) => ({ value: l, label: l })) },
        { name: 'topic', label: t('topic'), type: 'text', required: true, colSpan: 2, placeholder: 'ex: les fractions' },
        { name: 'count', label: t('count'), type: 'number', defaultValue: 10 },
      ]}
    />
  );
}
