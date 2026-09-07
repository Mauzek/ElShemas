import { useRef, useState } from 'react';
import {
  Cable,
  FilePlus2,
  FolderOpen,
  Grid3x3,
  Hand,
  Image as ImageIcon,
  Keyboard,
  Library,
  ListChecks,
  Magnet,
  Moon,
  MousePointer2,
  Printer,
  Redo2,
  Save,
  Sun,
  Table2,
  Type as TypeIcon,
  Undo2,
} from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi, type Tool } from '../store/useUi';
import {
  cmdFit,
  cmdNew,
  cmdOpenFile,
  cmdPrint,
  cmdSaveJson,
  cmdToggleTheme,
} from '../lib/commands';

const TOOLS: { id: Tool; icon: typeof Hand; title: string }[] = [
  { id: 'select', icon: MousePointer2, title: 'Выделение (V)' },
  { id: 'hand', icon: Hand, title: 'Рука (H)' },
  { id: 'wire', icon: Cable, title: 'Провод (W)' },
  { id: 'text', icon: TypeIcon, title: 'Текст (T)' },
];

function Sep() {
  return <span className="mx-1 h-5 w-px" style={{ background: 'var(--ui-line)' }} />;
}

export function TopBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const doc = useDoc((s) => s.doc);
  const setTitle = useDoc((s) => s.setTitle);
  const setGrid = useDoc((s) => s.setGrid);
  const undo = useDoc((s) => s.undo);
  const redo = useDoc((s) => s.redo);
  const past = useDoc((s) => s.past.length);
  const future = useDoc((s) => s.future.length);

  const tool = useUi((s) => s.tool);
  const setTool = useUi((s) => s.setTool);
  const settings = useUi((s) => s.settings);
  const setSettings = useUi((s) => s.setSettings);
  const setDialog = useUi((s) => s.setDialog);

  return (
    <header
      className="no-print panel divider-b flex items-center gap-1 px-2"
      style={{ height: 40, flex: '0 0 auto' }}
    >
      <input
        className="field"
        style={{ width: 190, fontWeight: 500 }}
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

      <Sep />
      <button className="tbtn" onClick={cmdNew} title="Новая схема">
        <FilePlus2 size={16} />
      </button>
      <button className="tbtn" onClick={() => fileRef.current?.click()} title="Открыть файл .json">
        <FolderOpen size={16} />
      </button>
      <button className="tbtn" onClick={cmdSaveJson} title="Сохранить как файл .json (Ctrl+S)">
        <Save size={16} />
      </button>
      <button className="tbtn" onClick={() => setDialog('export')} title="Экспорт PNG / SVG (Ctrl+E)">
        <ImageIcon size={16} />
      </button>
      <button className="tbtn" onClick={() => setDialog('manager')} title="Мои схемы">
        <Library size={16} />
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

      <Sep />
      <button className="tbtn" onClick={undo} disabled={past === 0} title="Отменить (Ctrl+Z)">
        <Undo2 size={16} />
      </button>
      <button className="tbtn" onClick={redo} disabled={future === 0} title="Повторить (Ctrl+Shift+Z)">
        <Redo2 size={16} />
      </button>

      <Sep />
      {TOOLS.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          className={`tbtn ${tool === id ? 'active' : ''}`}
          onClick={() => setTool(id)}
          title={title}
          aria-pressed={tool === id}
        >
          <Icon size={16} />
        </button>
      ))}

      <Sep />
      <button
        className={`tbtn ${settings.showGrid ? 'active' : ''}`}
        onClick={() => setSettings({ showGrid: !settings.showGrid })}
        title="Показывать сетку"
        aria-pressed={settings.showGrid}
      >
        <Grid3x3 size={16} />
      </button>
      <button
        className={`tbtn ${settings.snap ? 'active' : ''}`}
        onClick={() => setSettings({ snap: !settings.snap })}
        title="Привязка к сетке (G)"
        aria-pressed={settings.snap}
      >
        <Magnet size={16} />
      </button>
      <select
        className="field"
        style={{ width: 62 }}
        value={doc.grid}
        onChange={(e) => setGrid(Number(e.target.value))}
        aria-label="Шаг сетки"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={40}>40</option>
      </select>

      <div className="flex-1" />

      <button className="tbtn" onClick={() => setDialog('check')} title="Проверка схемы">
        <ListChecks size={16} />
      </button>
      <button className="tbtn" onClick={() => setDialog('bom')} title="Список элементов">
        <Table2 size={16} />
      </button>
      <button className="tbtn" onClick={cmdFit} title="Вписать в экран (Ctrl+1)">
        Вписать
      </button>
      <button className="tbtn" onClick={cmdPrint} title="Печать">
        <Printer size={16} />
      </button>
      <button className="tbtn" onClick={cmdToggleTheme} title="Светлая / тёмная тема">
        {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button className="tbtn" onClick={() => setDialog('shortcuts')} title="Горячие клавиши (?)">
        <Keyboard size={16} />
      </button>
    </header>
  );
}
