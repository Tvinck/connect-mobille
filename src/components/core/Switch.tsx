import { useState } from 'react';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, defaultChecked = false, onChange, disabled = false }: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const isOn = checked !== undefined ? checked : inner;

  function toggle() {
    if (disabled) return;
    const next = !isOn;
    if (checked === undefined) setInner(next);
    if (onChange) onChange(next);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={isOn}
      type="button"
      style={{
        width: 51,
        height: 31,
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        padding: 2,
        background: isOn ? 'var(--accent)' : 'var(--surface-3)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOn ? 'flex-end' : 'flex-start',
      }}
    >
      <span
        style={{
          width: 27,
          height: 27,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          transition: 'transform 0.2s',
        }}
      ></span>
    </button>
  );
}
