import { Cable, Grid3x3, Hand, Magnet, MousePointer2, Pencil, Type as TypeIcon } from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi, type Tool } from '../store/useUi';
import { Dropdown } from './Dropdown';

const TOOLS: { id: Tool; icon: typeof Hand; title: string }[] = [
  { id: 'select', icon: MousePointer2, title: 'Выделение (V)' },
  { id: 'hand', icon: Hand, title: 'Рука (H)' },
  { id: 'wire', icon: Cable, title: 'Провод (W)' },
  { id: 'text', icon: TypeIcon, title: 'Текст (T)' },
  { id: 'draw', icon: Pencil, title: 'Карандаш (P)' },
];

const PEN_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#111827'];

/** Плавающая панель инструментов внизу полотна с настройками активного инструмента. */
export function FloatingToolbar() {
  const tool = useUi((s) => s.tool);
  const setTool = useUi((s) => s.setTool);
  const settings = useUi((s) => s.settings);
  const setSettings = useUi((s) => s.setSettings);
  const grid = useDoc((s) => s.doc.grid);
  const setGrid = useDoc((s) => s.setGrid);

  return (
    <div className="floating-bar no-print" role="toolbar" aria-label="Инструменты">
      {TOOLS.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          className={`tbtn ${tool === id ? 'active' : ''}`}
          onClick={() => setTool(id)}
          data-tip={title}
          aria-pressed={tool === id}
        >
          <Icon size={17} />
        </button>
      ))}

      <span className="divider-v" />

      <button
        className={`tbtn ${settings.showGrid ? 'active' : ''}`}
        onClick={() => setSettings({ showGrid: !settings.showGrid })}
        data-tip="Показывать сетку (Shift+G)"
        aria-pressed={settings.showGrid}
      >
        <Grid3x3 size={17} />
      </button>
      <button
        className={`tbtn ${settings.snap ? 'active' : ''}`}
        onClick={() => setSettings({ snap: !settings.snap })}
        data-tip="Привязка к сетке (G)"
        aria-pressed={settings.snap}
      >
        <Magnet size={17} />
      </button>
      <Dropdown
        value={grid}
        onChange={setGrid}
        placement="top"
        width={84}
        ariaLabel="Шаг сетки"
        options={[
          { value: 10, label: '10 px' },
          { value: 20, label: '20 px' },
          { value: 40, label: '40 px' },
        ]}
      />

      {tool === 'draw' && (
        <>
          <span className="divider-v" />
          {PEN_COLORS.map((color) => (
            <button
              key={color}
              className="swatch"
              onClick={() => setSettings({ penColor: color })}
              data-tip={`Цвет ${color}`}
              aria-label={`Цвет ${color}`}
              aria-pressed={settings.penColor === color}
              style={{
                background: color,
                boxShadow: settings.penColor === color ? '0 0 0 2px var(--ui-surface), 0 0 0 4px var(--ui-accent)' : 'none',
              }}
            />
          ))}
          <input
            type="color"
            style={{ width: 30, height: 26 }}
            value={settings.penColor}
            onChange={(e) => setSettings({ penColor: e.target.value })}
            aria-label="Свой цвет карандаша"
            data-tip="Свой цвет"
          />
          <input
            type="range"
            min={1}
            max={16}
            value={settings.penWidth}
            onChange={(e) => setSettings({ penWidth: Number(e.target.value) })}
            style={{ width: 84 }}
            aria-label="Толщина карандаша"
            data-tip={`Толщина ${settings.penWidth} px`}
          />
        </>
      )}

      {tool === 'wire' && (
        <>
          <span className="divider-v" />
          <button
            className={`tbtn ${settings.freeAngleWire ? 'active' : ''}`}
            onClick={() => setSettings({ freeAngleWire: !settings.freeAngleWire })}
            data-tip="Свободный угол провода (иначе только ортогональные; Shift даёт 45°)"
            aria-pressed={settings.freeAngleWire}
          >
            {settings.freeAngleWire ? 'Свободный угол' : 'Ортогональные'}
          </button>
        </>
      )}
    </div>
  );
}
