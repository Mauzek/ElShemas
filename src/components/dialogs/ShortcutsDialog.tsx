import { useUi } from '../../store/useUi';
import { Dialog } from './Dialog';

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Инструменты',
    items: [
      ['V', 'Выделение'],
      ['H', 'Рука (панорамирование)'],
      ['W', 'Провод'],
      ['T', 'Текстовая подпись'],
      ['P', 'Карандаш — рисование от руки'],
      ['G', 'Привязка к сетке вкл/выкл'],
      ['Shift+G', 'Показать или скрыть сетку'],
    ],
  },
  {
    title: 'Работа с элементами',
    items: [
      ['R', 'Повернуть на 90°'],
      ['Shift+R', 'Повернуть на 45° (схемы-ромбы)'],
      ['F', 'Зеркально отразить'],
      ['Del / Backspace', 'Удалить выделенное'],
      ['Ctrl+C / Ctrl+V', 'Копировать / вставить'],
      ['Ctrl+D', 'Дублировать'],
      ['Ctrl+A', 'Выделить всё'],
      ['Двойной клик', 'Редактировать обозначение (Tab — значение)'],
      ['Стрелки', 'Сдвиг на шаг сетки (Shift — на 1 px)'],
    ],
  },
  {
    title: 'Провода',
    items: [
      ['Клик', 'Начать провод / поставить излом'],
      ['Tab', 'Сменить направление первого сегмента'],
      ['Enter / двойной клик', 'Завершить провод'],
      ['Esc', 'Отменить провод или размещение'],
      ['Shift', 'Шаг 45° в режиме свободного угла'],
    ],
  },
  {
    title: 'Навигация и файлы',
    items: [
      ['Пробел + перетаскивание', 'Панорамирование'],
      ['Средняя кнопка мыши', 'Панорамирование'],
      ['Колесо мыши', 'Масштаб к курсору'],
      ['Ctrl+0 / Ctrl+1', 'Масштаб 100% / вписать в экран'],
      ['Ctrl+Z / Ctrl+Shift+Z', 'Отменить / повторить'],
      ['Ctrl+S', 'Сохранить схему в файл'],
      ['Ctrl+E', 'Экспорт изображения'],
      ['Ctrl+R', 'Считать схему: токи и напряжения'],
      ['Ctrl+P', 'Печать'],
      ['?', 'Эта справка'],
    ],
  },
];

export function ShortcutsDialog() {
  const setDialog = useUi((s) => s.setDialog);
  return (
    <Dialog title="Горячие клавиши" onClose={() => setDialog(null)} width={560}>
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {GROUPS.map((group) => (
          <section key={group.title}>
            <p className="section-title mb-1">{group.title}</p>
            <dl>
              {group.items.map(([key, description]) => (
                <div key={key} className="mb-1 flex gap-2">
                  <dt
                    className="rounded border px-1"
                    style={{ borderColor: 'var(--ui-line)', flex: '0 0 auto', fontSize: 11 }}
                  >
                    {key}
                  </dt>
                  <dd style={{ color: 'var(--ui-muted)' }}>{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
