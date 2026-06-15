'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, FileDown, FileText, Save, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/markdown';
import { api, downloadFile } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { DOC_TYPE_META } from '@/lib/constants';
import type { DocumentFull } from '@/lib/types';

export default function DocumentDetailPage() {
  const { t, lang } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentFull | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get<{ document: DocumentFull }>(`/documents/${params.id}`)
      .then((res) => {
        setDoc(res.document);
        setTitle(res.document.title);
        setContent(res.document.content);
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const res = await api.patch<{ document: DocumentFull }>(`/documents/${doc.id}`, { title, content });
      setDoc(res.document);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!doc) return;
    const res = await api.post<{ document: DocumentFull }>(`/documents/${doc.id}/duplicate`);
    router.push(`/bibliotheque/${res.document.id}`);
  };

  const remove = async () => {
    if (!doc || !confirm(t('confirmDelete'))) return;
    await api.delete(`/documents/${doc.id}`);
    router.push('/bibliotheque');
  };

  if (notFound) {
    return (
      <div className="text-center text-muted-foreground">
        <p>404</p>
        <Link href="/bibliotheque" className="text-primary hover:underline">
          {t('back')}
        </Link>
      </div>
    );
  }

  if (!doc) return <p className="text-muted-foreground">{t('loading')}</p>;

  const docLabel = lang === 'ar' ? DOC_TYPE_META[doc.type].labelAr : DOC_TYPE_META[doc.type].labelFr;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('back')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge className={DOC_TYPE_META[doc.type].color}>{docLabel}</Badge>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? t('loading') : t('save')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setTitle(doc.title); setContent(doc.content); }}>
                {t('cancel')}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> {t('edit')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadFile(doc.id, 'pdf', doc.title)}>
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadFile(doc.id, 'docx', doc.title)}>
                <FileText className="h-4 w-4" /> Word
              </Button>
              <Button size="sm" variant="ghost" onClick={duplicate} title={t('duplicate')}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={remove} className="text-destructive hover:text-destructive" title={t('delete')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[60vh] font-mono text-sm" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <h1 className="mb-4 text-xl font-bold">{doc.title}</h1>
            <Markdown content={doc.content} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
