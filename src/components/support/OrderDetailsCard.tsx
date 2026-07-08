import React from 'react';
import type { OrderDetails } from '../../types/support';

interface Props {
  details: OrderDetails;
}

function fmt(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtMoney(amount?: number, currency = 'RUB') {
  if (amount == null) return '—';
  return amount.toLocaleString('ru-RU', { style: 'currency', currency, minimumFractionDigits: 2 });
}

const statusStyle: Record<string, string> = {
  green: '#34c759',
  yellow: '#ff9f0a',
  red: '#ff3b30',
  gray: 'var(--text-3)',
};

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderBottom: '0.5px solid var(--hair)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'var(--font-mono, monospace)' : undefined }}>
        {value}
      </span>
    </div>
  );
}

export function OrderDetailsCard({ details }: Props) {
  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* Заголовок с платформой */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px' }}>
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
          {details.platformLabel} · Заказ #{details.orderId}
        </span>
        {details.orderUrl && (
          <a
            href={details.orderUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Открыть ↗
          </a>
        )}
      </div>

      {/* Статус — крупно */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 20,
        background: statusStyle[details.statusColor] + '22',
        marginBottom: 8,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusStyle[details.statusColor], flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: statusStyle[details.statusColor] }}>
          {details.status}
        </span>
      </div>

      {/* Основные поля */}
      <Row label="Товар" value={details.productName || `ID: ${details.productId}`} />
      {details.options && details.options.length > 0 && (
        <Row label="Параметры" value={
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {details.options.map(o => o.user_data).join(' · ')}
          </span>
        } />
      )}
      <Row label="Номер заказа" value={String(details.orderId)} mono />
      {details.productId && <Row label="ID товара" value={details.productId} mono />}
      <Row label="Дата создания" value={fmt(details.createdAt)} />
      <Row label="Дата оплаты" value={fmt(details.paidAt)} />

      {/* Покупатель */}
      {details.buyerEmail && (
        <Row label="Покупатель" value={
          <a href={`mailto:${details.buyerEmail}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            {details.buyerEmail}
          </a>
        } />
      )}
      {details.buyerIp && <Row label="IP-адрес" value={details.buyerIp} mono />}
      {details.paymentMethod && <Row label="Способ оплаты" value={details.paymentMethod} />}
      {details.paymentAggregator && (
        <Row label="Агрегатор" value={details.paymentAggregator} />
      )}

      {/* Финансы */}
      {details.amount != null && (
        <Row label="Сумма" value={fmtMoney(details.amount, details.currency)} />
      )}
      {details.profit != null && (
        <Row label="Ваш доход" value={
          <span style={{ color: '#34c759', fontWeight: 600 }}>
            {fmtMoney(details.profit, details.currency)}
          </span>
        } />
      )}
    </div>
  );
}
