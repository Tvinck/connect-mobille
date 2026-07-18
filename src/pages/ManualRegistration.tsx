import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Card } from '../components/layout/Card';
import { Button } from '../components/core/Button';
import { Badge } from '../components/core/Badge';
import { Icon } from '../components/core/Icon';
import { toast } from '../lib/toast';
import {
  AVITO_TARIFFS,
  REGISTRATION_PLATFORMS,
  DEFAULT_APPROVER,
  BAZZAR_SERTS_URL,
  generateRegistrationCode,
  registrationStatusMeta,
  tariffByMonths,
  type RegistrationPlatform,
} from '../lib/tariffs';

interface Registration {
  id: string;
  code: string;
  created_by: string | null;
  created_by_name: string | null;
  platform: string;
  guarantee_months: number;
  price: number;
  extra_info: string | null;
  status: string;
  udid: string | null;
  device_model: string | null;
  paid_at: string | null;
  created_at: string;
}

interface ManualRegistrationProps {
  onBack: () => void;
}

const platformLabel = (key: string) =>
  REGISTRATION_PLATFORMS.find((p) => p.key === key)?.label || key;

export function ManualRegistration({ onBack }: ManualRegistrationProps) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Registration | null>(null);

  // Текущий оператор
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Форма
  const [platform, setPlatform] = useState<RegistrationPlatform>('avito');
  const [months, setMonths] = useState<number>(AVITO_TARIFFS[0].guaranteeMonths);
  const [extra, setExtra] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  // Профиль оператора
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();
      setUserName(profile?.full_name || user.email?.split('@')[0] || 'Оператор');
    });
  }, []);

  // Список заявок + realtime
  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setItems((data as Registration[]) || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel('manual_registrations_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_registrations' }, () => fetchItems())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Ссылка скопирована', 'success');
    } catch {
      toast('Не удалось скопировать ссылку', 'error');
    }
  };

  const submit = async () => {
    if (!userId) {
      toast('Профиль оператора ещё не загружен', 'error');
      return;
    }
    const tariff = tariffByMonths(months);
    if (!tariff) return;
    setSubmitting(true);
    try {
      const code = generateRegistrationCode();
      const { error } = await supabase.from('manual_registrations').insert({
        code,
        created_by: userId,
        created_by_name: userName,
        platform,
        guarantee_months: tariff.guaranteeMonths,
        price: tariff.price,
        extra_info: extra.trim() || null,
        approver_id: DEFAULT_APPROVER.id,
        status: 'thinking',
      });
      if (error) throw error;
      const link = `${BAZZAR_SERTS_URL}/r/${code}`;
      setCreatedLink(link);
      copyLink(link);
      // сброс формы
      setExtra('');
      fetchItems();
    } catch (err: any) {
      console.error('Failed to create registration:', err);
      toast('Ошибка при создании заявки: ' + (err.message || ''), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const markRefused = async (id: string) => {
    try {
      const { error } = await supabase.from('manual_registrations').update({ status: 'refused' }).eq('id', id);
      if (error) throw error;
      toast('Заявка отмечена как «Отказался»', 'info');
      setSelected(null);
      fetchItems();
    } catch (err: any) {
      toast('Не удалось обновить статус: ' + (err.message || ''), 'error');
    }
  };

  // ── Экран создания ─────────────────────────────────────────────────────────
  if (view === 'create') {
    const tariff = tariffByMonths(months);

    if (createdLink) {
      return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', paddingBottom: 40 }}>
          <NavBar title="Заявка создана" onBack={() => { setCreatedLink(null); setView('list'); }} />
          <div style={{ padding: '0 var(--screen-pad)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
              <span style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--green-dim)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="circle-check" size={38} color="#4cd964" strokeWidth={2} />
              </span>
              <div style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)', marginTop: 14 }}>Ссылка готова</div>
              <div style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', marginTop: 6, lineHeight: 'var(--lh-body)' }}>
                Отправьте её клиенту в Авито. Он зарегистрирует устройство и оплатит.
              </div>
            </div>

            <Card>
              <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)', marginBottom: 6 }}>Спец-ссылка</div>
              <div style={{ fontSize: 'var(--fs-subhead)', wordBreak: 'break-all', fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent)' }}>{createdLink}</div>
            </Card>

            <Button variant="blue" block icon={<Icon name="copy" size={18} color="#fff" />} onClick={() => copyLink(createdLink)}>
              Скопировать ссылку
            </Button>
            <Button variant="tonal" block onClick={() => { setCreatedLink(null); setView('list'); }}>
              К списку заявок
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', paddingBottom: 40 }}>
        <NavBar title="Новая заявка" onBack={() => setView('list')} />
        <div style={{ padding: '0 var(--screen-pad)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Платформа */}
          <div>
            <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)', marginBottom: 8 }}>Платформа</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {REGISTRATION_PLATFORMS.map((p) => {
                const on = platform === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlatform(p.key)}
                    style={{
                      flex: 1, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      padding: '10px 8px', borderRadius: 'var(--radius)', fontSize: 'var(--fs-subhead)',
                      fontWeight: 'var(--fw-semibold)',
                      background: on ? 'var(--accent)' : 'var(--surface-2)',
                      color: on ? '#fff' : 'var(--text-2)',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Тариф */}
          <div>
            <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)', marginBottom: 8 }}>Тариф (гарантия)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {AVITO_TARIFFS.map((tr) => {
                const on = months === tr.guaranteeMonths;
                return (
                  <button
                    key={tr.guaranteeMonths}
                    type="button"
                    onClick={() => setMonths(tr.guaranteeMonths)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      border: on ? '1.5px solid var(--accent)' : '1px solid var(--hair)', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', padding: '14px 16px', borderRadius: 'var(--radius)',
                      background: on ? 'var(--accent-dim)' : 'var(--surface)', color: 'var(--text)', width: '100%',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name={on ? 'circle-check' : 'circle'} size={20} color={on ? 'var(--accent)' : 'var(--text-3)'} />
                      <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' }}>{tr.label}</span>
                    </span>
                    <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)' }}>{tr.price} ₽</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Доп. информация */}
          <div>
            <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)', marginBottom: 8 }}>Доп. информация</div>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Напр.: клиент просит приложение Scarlet"
              rows={3}
              style={{
                width: '100%', background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--text)',
                padding: '12px 16px', borderRadius: 'var(--radius)', outline: 'none', resize: 'vertical',
                fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Согласующий */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)' }}>Согласующий</span>
              <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' }}>
                {DEFAULT_APPROVER.name} <span style={{ color: 'var(--text-3)', fontWeight: 'var(--fw-regular, 400)' }}>{DEFAULT_APPROVER.handle}</span>
              </span>
            </div>
          </Card>

          <Button variant="primary" block disabled={submitting || !tariff} onClick={submit}>
            {submitting ? 'Создаём…' : `Создать регистрацию · ${tariff?.price ?? ''} ₽`}
          </Button>
        </div>
      </div>
    );
  }

  // ── Список заявок ───────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar
        title="Ручная регистрация"
        subtitle={`${items.length} заявок`}
        onBack={onBack}
        right={
          <button onClick={() => setView('create')} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icon name="plus" size={26} color="var(--accent)" strokeWidth={2.4} />
          </button>
        }
      />

      <div style={{ padding: '4px var(--screen-pad) 12px' }}>
        <Button variant="tonal" block icon={<Icon name="plus" size={18} color="var(--accent)" />} onClick={() => setView('create')}>
          Новая заявка
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Загрузка заявок…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>Пока нет заявок. Создайте первую.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
          {items.map((it) => {
            const st = registrationStatusMeta[it.status] || { label: it.status, tone: 'neutral' as const };
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setSelected(it)}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'none', border: 'none', padding: '12px', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontFamily: 'var(--font-sans)', width: '100%', borderRadius: 'var(--radius)', borderBottom: '0.5px solid var(--hair)' }}
              >
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="file-text" size={20} color="var(--accent)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}>
                      {it.guarantee_months} мес · {it.price} ₽
                    </span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '5px 0' }}>
                    <Badge tone="neutral">{platformLabel(it.platform)}</Badge>
                    {it.extra_info ? <span style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.extra_info}</span> : null}
                  </span>
                  <span style={{ display: 'block', fontSize: 'var(--fs-footnote)', color: 'var(--text-3)' }}>
                    {it.created_by_name || '—'} · {new Date(it.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Детали заявки — нижний лист */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: '20px 16px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)' }}>Заявка · {selected.guarantee_months} мес</div>
              <Badge tone={(registrationStatusMeta[selected.status] || { tone: 'neutral' as const }).tone}>
                {(registrationStatusMeta[selected.status] || { label: selected.status }).label}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--fs-subhead)' }}>
              <Row label="Тариф" value={`${selected.guarantee_months} мес · ${selected.price} ₽`} />
              <Row label="Платформа" value={platformLabel(selected.platform)} />
              <Row label="Создал" value={selected.created_by_name || '—'} />
              {selected.extra_info ? <Row label="Доп. инфо" value={selected.extra_info} /> : null}
              {selected.udid ? <Row label="UDID" value={selected.udid} mono /> : null}
              {selected.paid_at ? <Row label="Оплачено" value={new Date(selected.paid_at).toLocaleString('ru-RU')} /> : null}
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
              <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)', marginBottom: 4 }}>Спец-ссылка</div>
              <div style={{ fontSize: 'var(--fs-footnote)', wordBreak: 'break-all', color: 'var(--accent)', fontFamily: 'var(--font-mono, monospace)' }}>{`${BAZZAR_SERTS_URL}/r/${selected.code}`}</div>
            </div>

            <Button variant="blue" block icon={<Icon name="copy" size={18} color="#fff" />} onClick={() => copyLink(`${BAZZAR_SERTS_URL}/r/${selected.code}`)}>
              Скопировать ссылку
            </Button>
            {selected.status !== 'paid' && selected.status !== 'refused' && (
              <Button variant="plain" block onClick={() => markRefused(selected.id)} style={{ color: 'var(--red)' }}>
                Отметить «Отказался»
              </Button>
            )}
            <Button variant="plain" block onClick={() => setSelected(null)}>Закрыть</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', borderBottom: '0.5px solid var(--hair)' }}>
      <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text)', textAlign: 'right', wordBreak: mono ? 'break-all' : 'normal', fontFamily: mono ? 'var(--font-mono, monospace)' : undefined }}>{value}</span>
    </div>
  );
}
