'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Copy, Trash2, FileDown, FileText, Library } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, downloadFile } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { DOC_TYPE_META } from '@/lib/constants';
import type { DocumentSummary, DocType } from '@/lib/types';

const TYPES: (DocType | 'ALL')[] = ['ALL', 'JDADA', 'CONTROLE', 'EXAMEN', 'EXERCICES', 'DEVOIR'];

export default function BibliothequePage() {
  const { t, lang } = useI18n();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [filter, setFilter] = useState<DocType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const path = filter === 'ALL' ? '/documents' : `/documents?type=${filter}`;
    const res = await api.get<{ documents: DocumentSummary[] }>(path);
    setDocs(res.documents);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const docLabel = (type: DocType) => (lang === 'ar' ? DOC_TYPE_META[type].labelAr : DOC_TYPE_META[type].labelFr);

  const duplicate = async (id: string) => {
    await api.post(`/documents/${id}/duplicate`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await api.delete(`/documents/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bibliotheque')}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              filter === type ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
            )}
          >
            {type === 'ALL' ? t('all') : docLabel(type)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t('loading')}</p>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Library className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t('libraryEmpty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 pt-6">
                <div className="flex items-center justify-between">
                  <Badge className={DOC_TYPE_META[doc.type].color}>{docLabel(doc.type)}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
                <Link href={`/bibliotheque/${doc.id}`} className="flex-1">
                  <h3 className="font-semibold leading-snug hover:text-primary">{doc.title}</h3>
                  {doc.subject && <p className="mt-1 text-sm text-muted-foreground">{doc.subject} · {doc.level}</p>}
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => downloadFile(doc.id, 'pdf', doc.title)}>
                    <FileDown className="h-4 w-4" /> PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadFile(doc.id, 'docx', doc.title)}>
                    <FileText className="h-4 w-4" /> Word
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicate(doc.id)} title={t('duplicate')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(doc.id)} title={t('delete')} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
