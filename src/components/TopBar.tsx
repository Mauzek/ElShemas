import { useState } from 'react';
import { Image as ImageIcon, Maximize2, Redo2, Undo2 } from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { cmdFit } from '../lib/commands';
import { AppMenu } from './AppMenu';

/** Левый бабл над полотном: меню, название схемы и история. */
export function TopLeftBar() {
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const doc = useDoc((s) => s.doc);
  const setTitle = useDoc((s) => s.setTitle);
  const undo = useDoc((s) => s.undo);
  const redo = useDoc((s) => s.redo);
  const past = useDoc((s) => s.past.length);
  const future = useDoc((s) => s.future.length);

  return (
    <div className="float-bar top-left no-print">
      <AppMenu />
      <span className="divider-v" />
      <input
        className="field field-ghost"
        style={{ width: 176 }}
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
        data-tip="Название схемы"
      />
      <span className="divider-v" />
      <button className="tbtn" onClick={undo} disabled={past === 0} data-tip="Отменить (Ctrl+Z)">
        <Undo2 size={17} />
      </button>
      <button className="tbtn" onClick={redo} disabled={future === 0} data-tip="Повторить (Ctrl+Shift+Z)">
        <Redo2 size={17} />
      </button>
    </div>
  );
}

/** Правый бабл над полотном: вписать в экран и экспорт. */
export function TopRightBar() {
  const setDialog = useUi((s) => s.setDialog);
  return (
    <div className="float-bar top-right no-print">
      <button className="tbtn" onClick={cmdFit} data-tip="Вписать в экран (Ctrl+1)">
        <Maximize2 size={17} />
      </button>
      <button className="tbtn tbtn-primary" onClick={() => setDialog('export')} data-tip="Экспорт PNG / SVG (Ctrl+E)">
        <ImageIcon size={16} />
        Экспорт
      </button>
    </div>
  );
}
