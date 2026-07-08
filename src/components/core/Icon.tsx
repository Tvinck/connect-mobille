import type { CSSProperties } from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 2, fill = 'none', style, onClick }: IconProps) {
  // Translate dash-case (e.g., "message-square") to PascalCase (e.g., "MessageSquare")
  const toPascal = (str: string) => {
    return str
      .split('-')
      .map(s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''))
      .join('');
  };

  const pascalName = toPascal(name);
  const IconComponent = (Icons as any)[pascalName] || Icons.HelpCircle;

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={fill}
      style={style}
      onClick={onClick}
    />
  );
}

