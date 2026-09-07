import { useUi } from '../store/useUi';
import { Dropdown } from './Dropdown';
import { Row } from './Row';

/** Настройки внешнего вида схемы: стиль катушки, пересечений и проводов. */
export function RenderSettings() {
  const settings = useUi((s) => s.settings);
  const setSettings = useUi((s) => s.setSettings);

  return (
    <>
      <Row label="Катушка">
        <Dropdown
          value={settings.inductorStyle}
          onChange={(v) => setSettings({ inductorStyle: v })}
          ariaLabel="Стиль катушки"
          options={[
            { value: 'box', label: 'Прямоугольник' },
            { value: 'arcs', label: 'Дуги' },
          ]}
        />
      </Row>
      <Row label="Пересечения">
        <Dropdown
          value={settings.crossingStyle}
          onChange={(v) => setSettings({ crossingStyle: v })}
          ariaLabel="Стиль пересечений"
          options={[
            { value: 'plain', label: 'Пересечение' },
            { value: 'hop', label: 'Перемычка' },
          ]}
        />
      </Row>
      <Row label="Провода">
        <Dropdown
          value={settings.freeAngleWire ? 'free' : 'ortho'}
          onChange={(v) => setSettings({ freeAngleWire: v === 'free' })}
          ariaLabel="Углы проводов"
          options={[
            { value: 'ortho', label: 'Ортогональные' },
            { value: 'free', label: 'Свободный угол' },
          ]}
        />
      </Row>
    </>
  );
}
