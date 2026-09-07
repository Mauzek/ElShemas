import { useRef, useState } from 'react';
import {
  Cable,
  FilePlus2,
  FolderOpen,
  Image as ImageIcon,
  Keyboard,
  Library,
  ListChecks,
  Maximize2,
  Moon,
  Printer,
  Redo2,
  Save,
  Sun,
  Table2,
  Undo2,
} from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { cmdFit, cmdNew, cmdOpenFile, cmdPrint, cmdSaveJson, cmdToggleTheme } from '../lib/commands';

export function TopBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draftTitle, setDraftTitle] = useState<string | null>(null);

  const doc = useDoc((s) => s.doc);
  const setTitle = useDoc((s) => s.setTitle);
  const undo = useDoc((s) => s.undo);
  const redo = useDoc((s) => s.redo);
  const past = useDoc((s) => s.past.length);
  const future = useDoc((s) => s.future.length);

  const settings = useUi((s) => s.settings);
  const setDialog = useUi((s) => s.setDialog);

  return (
    <header
      className="no-print card no-scrollbar flex items-center gap-1 overflow-x-auto px-2"
      style={{ height: 52, flex: '0 0 auto' }}
    >
      <span
        className="ml-1 flex items-center justify-center rounded-lg"
        style={{ width: 28, height: 28, background: 'var(--ui-accent-soft)', color: 'var(--ui-accent)' }}
        aria-hidden="true"
      >
        <Cable size={16} />
      </span>
      <input
        className="field field-ghost"
        style={{ width: 168 }}
        value={draftTitle ?? doc.title}
        onChange={(e) => setDraftTitle(e.target.value)}
        onBlur={() => {
          if (draftTitle !== null && draftTitle !== doc.title) setTitle(draftTitle.trim() || 'Схема без названия');
          setDraftTitle(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setDraftTitle(null);
            e.currentTarget.blur();
          }
          e.stopPropagation();
        }}
        aria-label="Название схемы"
      />

      <span className="divider-v" />
      <button className="tbtn" onClick={cmdNew} data-tip="Новая схема">
        <FilePlus2 size={17} />
      </button>
      <button className="tbtn" onClick={() => fileRef.current?.click()} data-tip="Открыть файл .json">
        <FolderOpen size={17} />
      </button>
      <button className="tbtn" onClick={cmdSaveJson} data-tip="Сохранить файл .json (Ctrl+S)">
        <Save size={17} />
      </button>
      <button className="tbtn" onClick={() => setDialog('manager')} data-tip="Мои схемы">
        <Library size={17} />
      </button>
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

      <span className="divider-v" />
      <button className="tbtn" onClick={undo} disabled={past === 0} data-tip="Отменить (Ctrl+Z)">
        <Undo2 size={17} />
      </button>
      <button className="tbtn" onClick={redo} disabled={future === 0} data-tip="Повторить (Ctrl+Shift+Z)">
        <Redo2 size={17} />
      </button>


      <div className="flex-1" style={{ minWidth: 8 }} />

      <button className="tbtn" onClick={cmdFit} data-tip="Вписать в экран (Ctrl+1)">
        <Maximize2 size={17} />
      </button>
      <button className="tbtn" onClick={() => setDialog('check')} data-tip="Проверка схемы">
        <ListChecks size={17} />
      </button>
      <button className="tbtn" onClick={() => setDialog('bom')} data-tip="Список элементов">
        <Table2 size={17} />
      </button>
      <button className="tbtn" onClick={cmdPrint} data-tip="Печать (Ctrl+P)">
        <Printer size={17} />
      </button>
      <button className="tbtn" onClick={cmdToggleTheme} data-tip="Светлая / тёмная тема">
        {settings.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button className="tbtn" onClick={() => setDialog('shortcuts')} data-tip="Горячие клавиши (?)">
        <Keyboard size={17} />
      </button>
      <button className="tbtn tbtn-primary" onClick={() => setDialog('export')} data-tip="Экспорт PNG / SVG (Ctrl+E)">
        <ImageIcon size={16} />
        Экспорт
      </button>
    </header>
  );
}
