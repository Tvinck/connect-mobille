import { Icon } from '../core/Icon';

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onDismiss?: () => void;
  onClick?: () => void;
  gradient?: string;
}

export function PromoBanner({ title, subtitle, icon = 'shield', onDismiss, onClick, gradient }: PromoBannerProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: gradient || 'var(--promo-grad)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 130px 20px 20px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)', color: '#fff', lineHeight: 'var(--lh-tight)', marginBottom: 8 }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 'var(--fs-subhead)', color: 'rgba(255,255,255,0.75)', lineHeight: 'var(--lh-body)' }}>{subtitle}</div> : null}
      <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.9 }}>
        <Icon name={icon} size={92} color="rgba(255,255,255,0.85)" strokeWidth={1.2} fill="rgba(255,255,255,0.25)" />
      </div>
      {onDismiss ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          type="button"
          style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icon name="x" size={16} color="#2e7d44" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
