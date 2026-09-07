import type { ReactNode } from 'react';

/** Строка панели свойств: подпись слева, контрол справа. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-2 grid items-center gap-2" style={{ gridTemplateColumns: '80px 1fr' }}>
      <span style={{ color: 'var(--ui-muted)', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}
