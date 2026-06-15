'use client';

import { Generator } from '@/components/generator';
import { useI18n } from '@/lib/i18n';
import { SUBJECTS, LEVELS } from '@/lib/constants';

export default function ControlesPage() {
  const { t } = useI18n();
  return (
    <Generator
      title={t('controles')}
      description={t('controleDesc')}
      endpoint="/generate/controle"
      fields={[
        { name: 'subject', label: t('subject'), type: 'select', required: true, options: SUBJECTS.map((s) => ({ value: s, label: s })) },
        { name: 'level', label: t('level'), type: 'select', required: true, options: LEVELS.map((l) => ({ value: l, label: l })) },
        { name: 'chapter', label: t('chapter'), type: 'text', required: true, colSpan: 2 },
        {
          name: 'difficulty',
          label: t('difficulty'),
          type: 'select',
          defaultValue: 'moyen',
          options: [
            { value: 'facile', label: t('easy') },
            { value: 'moyen', label: t('medium') },
            { value: 'difficile', label: t('hard') },
          ],
        },
      ]}
    />
  );
}
