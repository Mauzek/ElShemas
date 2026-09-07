import { useUi } from '../store/useUi';
import { Row } from './Row';

const SWATCHES = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#111827'];

/** Настройки карандаша: цвет и толщина будущих штрихов. */
export function PenSettings() {
  const settings = useUi((s) => s.settings);
  const setSettings = useUi((s) => s.setSettings);

  return (
    <>
      <Row label="Цвет">
        <span className="flex items-center gap-1">
          {SWATCHES.map((color) => (
            <button
              key={color}
              onClick={() => setSettings({ penColor: color })}
              data-tip={color}
              aria-label={`Цвет ${color}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: color,
                border: settings.penColor === color ? '2px solid var(--ui-accent)' : '1px solid var(--ui-line)',
                outline: settings.penColor === color ? '2px solid var(--ui-accent-ring)' : 'none',
                cursor: 'pointer',
              }}
            />
          ))}
          <input
            type="color"
            style={{ width: 26, height: 22 }}
            value={settings.penColor}
            onChange={(e) => setSettings({ penColor: e.target.value })}
            aria-label="Свой цвет карандаша"
          />
        </span>
      </Row>
      <Row label="Толщина">
        <span className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={16}
            step={1}
            value={settings.penWidth}
            onChange={(e) => setSettings({ penWidth: Number(e.target.value) })}
            style={{ flex: 1 }}
            aria-label="Толщина карандаша"
          />
          <span style={{ width: 26, textAlign: 'right', color: 'var(--ui-muted)' }}>{settings.penWidth}</span>
        </span>
      </Row>
    </>
  );
}
