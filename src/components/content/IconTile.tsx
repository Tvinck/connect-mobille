import { Icon } from '../core/Icon';

interface IconTileProps {
  icon: string;
  color?: string;
  bg?: string;
  size?: number;
  radius?: number;
  iconSize?: number;
}

export function IconTile({ icon, color = 'var(--text-2)', bg = 'var(--surface-3)', size = 44, radius = 12, iconSize }: IconTileProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={iconSize || Math.round(size * 0.5)} color={color} strokeWidth={2} />
    </span>
  );
}
