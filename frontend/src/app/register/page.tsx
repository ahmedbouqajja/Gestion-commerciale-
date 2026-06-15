'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LangSwitcher } from '@/components/lang-switcher';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { SUBJECTS, LEVELS } from '@/lib/constants';

export default function RegisterPage() {
  const { t, lang } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', school: '', subject: '', level: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, language: lang });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <GraduationCap className="h-6 w-6 text-primary" /> {t('appName')}
          </Link>
          <LangSwitcher />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('signUp')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('name')}</Label>
                <Input id="name" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="subject">{t('subject')}</Label>
                  <Select id="subject" value={form.subject} onChange={set('subject')}>
                    <option value="">—</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">{t('level')}</Label>
                  <Select id="level" value={form.level} onChange={set('level')}>
                    <option value="">—</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="school">{t('school')}</Label>
                <Input id="school" value={form.school} onChange={set('school')} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading') : t('signUp')}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('signIn')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
