import { useRef } from 'react';
import {
  FilePlus2,
  FolderOpen,
  Image as ImageIcon,
  Keyboard,
  Library,
  ListChecks,
  Menu as MenuIcon,
  Moon,
  Printer,
  Save,
  Sun,
  Table2,
} from 'lucide-react';
import { useUi } from '../store/useUi';
import { cmdNew, cmdOpenFile, cmdPrint, cmdSaveJson, cmdToggleTheme } from '../lib/commands';
import { Menu } from './ui/Menu';

/** Главное меню: файловые операции, экспорт, проверка схемы и вид. */
export function AppMenu() {
  const fileRef = useRef<HTMLInputElement>(null);
  const setDialog = useUi((s) => s.setDialog);
  const theme = useUi((s) => s.settings.theme);

  return (
    <>
      <Menu
        ariaLabel="Главное меню"
        tip="Меню: файлы, экспорт, проверка"
        align="start"
        width={252}
        sections={[
          {
            title: 'Файл',
            items: [
              { icon: FilePlus2, label: 'Новая схема', onSelect: cmdNew },
              { icon: FolderOpen, label: 'Открыть файл…', onSelect: () => fileRef.current?.click() },
              { icon: Save, label: 'Сохранить как…', hint: 'Ctrl+S', onSelect: cmdSaveJson },
              { icon: Library, label: 'Мои схемы', onSelect: () => setDialog('manager') },
            ],
          },
          {
            title: 'Экспорт',
            items: [
              { icon: ImageIcon, label: 'Экспорт PNG / SVG…', hint: 'Ctrl+E', onSelect: () => setDialog('export') },
              { icon: Printer, label: 'Печать', hint: 'Ctrl+P', onSelect: cmdPrint },
            ],
          },
          {
            title: 'Схема',
            items: [
              { icon: ListChecks, label: 'Проверка схемы', onSelect: () => setDialog('check') },
              { icon: Table2, label: 'Список элементов', onSelect: () => setDialog('bom') },
            ],
          },
          {
            title: 'Вид',
            items: [
              {
                icon: theme === 'dark' ? Sun : Moon,
                label: theme === 'dark' ? 'Светлая тема' : 'Тёмная тема',
                onSelect: cmdToggleTheme,
              },
              { icon: Keyboard, label: 'Горячие клавиши', hint: '?', onSelect: () => setDialog('shortcuts') },
            ],
          },
        ]}
      >
        <MenuIcon size={17} />
      </Menu>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) cmdOpenFile(file);
          e.target.value = '';
        }}
      />
    </>
  );
}
