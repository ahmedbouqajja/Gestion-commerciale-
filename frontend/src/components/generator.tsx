'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, FileDown, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdown } from '@/components/markdown';
import { api, downloadFile } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import type { DocumentFull, Quota } from '@/lib/types';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  colSpan?: 1 | 2;
}

interface GeneratorProps {
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
}

export function Generator({ title, description, endpoint, fields }: GeneratorProps) {
  const { t, lang } = useI18n();
  const { refresh, quota } = useAuth();
  const initial: Record<string, string> = {};
  fields.forEach((f) => (initial[f.name] = f.defaultValue !== undefined ? String(f.defaultValue) : ''));

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DocumentFull | null>(null);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  const blocked = quota?.plan === 'FREE' && (quota?.remaining ?? 0) <= 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { language: lang };
      for (const f of fields) {
        payload[f.name] = f.type === 'number' ? Number(values[f.name]) : values[f.name];
      }
      const res = await api.post<{ document: DocumentFull; quota: Quota }>(endpoint, payload);
      setResult(res.document);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>

      {blocked && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{t('upgradePrompt')}</span>
            <Link href="/profil" className="ms-auto">
              <Button size="sm">{t('upgrade')}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.colSpan === 2 || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === 'select' ? (
                  <Select id={f.name} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} required={f.required}>
                    <option value="">—</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : f.type === 'textarea' ? (
                  <Textarea
                    id={f.name}
                    value={values[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                ) : (
                  <Input
                    id={f.name}
                    type={f.type}
                    value={values[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                    min={f.type === 'number' ? 1 : undefined}
                  />
                )}
              </div>
            ))}
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading || blocked} className="w-full sm:w-auto">
                {loading ? t('generating') : t('generate')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> {result.title}
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadFile(result.id, 'pdf', result.title)}>
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadFile(result.id, 'docx', result.title)}>
                <FileText className="h-4 w-4" /> Word
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-5">
              <Markdown content={result.content} />
            </div>
            <div className="mt-4">
              <Link href={`/bibliotheque/${result.id}`}>
                <Button variant="link" className="px-0">
                  {t('edit')} →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
