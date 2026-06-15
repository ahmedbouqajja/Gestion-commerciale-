'use client';

import { useEffect, useState } from 'react';
import { Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { SUBJECTS, LEVELS } from '@/lib/constants';
import type { User } from '@/lib/types';

export default function ProfilPage() {
  const { t } = useI18n();
  const { user, setUser, refresh } = useAuth();
  const [form, setForm] = useState({ name: '', school: '', subject: '', level: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, school: user.school ?? '', subject: user.subject ?? '', level: user.level ?? '' });
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const res = await api.patch<{ user: User }>('/auth/profile', form);
    setUser(res.user);
    setMsg(t('saved'));
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    try {
      await api.patch('/auth/password', pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      setPwdMsg(t('saved'));
    } catch (err) {
      setPwdMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const upgrade = async () => {
    const res = await api.post<{ user: User }>('/auth/upgrade');
    setUser(res.user);
    await refresh();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t('profil')}</h1>

      {/* Abonnement */}
      <Card className={user.plan === 'PRO' ? 'border-primary ring-1 ring-primary' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" /> {t('subscription')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{user.plan === 'PRO' ? t('proPlan') : t('freePlan')}</p>
            <p className="text-sm text-muted-foreground">
              {user.plan === 'PRO' ? t('proFeature1') : t('freeFeature1')}
            </p>
          </div>
          {user.plan === 'FREE' ? (
            <Button onClick={upgrade}>{t('upgrade')} — 29 DH{t('perMonth')}</Button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              <Check className="h-4 w-4" /> {t('currentPlan')}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profileInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('name')}</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>{t('email')}</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="subject">{t('subject')}</Label>
                <Select id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
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
                <Select id="level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
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
              <Input id="school" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
            </div>
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            <Button type="submit">{t('save')}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <Label htmlFor="cp">{t('currentPassword')}</Label>
              <Input
                id="cp"
                type="password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="np">{t('newPassword')}</Label>
              <Input
                id="np"
                type="password"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            {pwdMsg && <p className="text-sm text-emerald-600">{pwdMsg}</p>}
            <Button type="submit" variant="outline">
              {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
