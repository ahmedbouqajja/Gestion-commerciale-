'use client';

import { Generator } from '@/components/generator';
import { useI18n } from '@/lib/i18n';
import { SUBJECTS, LEVELS } from '@/lib/constants';

export default function ExamensPage() {
  const { t } = useI18n();
  return (
    <Generator
      title={t('examens')}
      description={t('examenDesc')}
      endpoint="/generate/examen"
      fields={[
        { name: 'subject', label: t('subject'), type: 'select', required: true, options: SUBJECTS.map((s) => ({ value: s, label: s })) },
        { name: 'level', label: t('level'), type: 'select', required: true, options: LEVELS.map((l) => ({ value: l, label: l })) },
        {
          name: 'examType',
          label: t('examType'),
          type: 'select',
          defaultValue: 'local',
          options: [
            { value: 'local', label: t('examLocal') },
            { value: 'semestriel', label: t('examSemestriel') },
            { value: 'blanc', label: t('examBlanc') },
          ],
        },
        { name: 'scope', label: t('scope'), type: 'textarea', required: true },
      ]}
    />
  );
}
