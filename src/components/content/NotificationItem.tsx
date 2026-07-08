import { IconTile } from './IconTile';

interface NotificationItemProps {
  category: string;
  date: string;
  time: string;
  title?: string;
  text?: string;
  icon?: string;
  iconColor?: string;
}

export function NotificationItem({ category, date, time, title, text, icon = 'newspaper', iconColor = 'var(--amber)' }: NotificationItemProps) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', gap: 14, fontFamily: 'var(--font-sans)' }}>
      <IconTile icon={icon} bg="var(--surface-3)" color={iconColor} size={44} radius={22} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-3)', marginBottom: 4 }}>
          {category} <span style={{ margin: '0 2px' }}>•</span> {date} <span style={{ margin: '0 2px' }}>•</span> {time}
        </div>
        {title ? <div style={{ fontSize: 'var(--fs-headline)', fontWeight: 'var(--fw-bold)', marginBottom: 4, lineHeight: 'var(--lh-tight)' }}>{title}</div> : null}
        {text ? <div style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', lineHeight: 'var(--lh-body)' }}>{text}</div> : null}
      </div>
    </div>
  );
}
