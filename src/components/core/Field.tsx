import React from 'react';

interface FieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}

export function Field({ value, defaultValue, onChange, placeholder, type = 'text', style }: FieldProps) {
  return (
    <input
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      style={Object.assign(
        {
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--hair)',
          color: 'var(--text)',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body)',
        },
        style
      )}
    />
  );
}
