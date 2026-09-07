import { useEffect } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import {
  cmdCopy,
  cmdDelete,
  cmdDuplicate,
  cmdEscape,
  cmdFinishWire,
  cmdFit,
  cmdMirror,
  cmdNudge,
  cmdPaste,
  cmdRotate,
  cmdSaveJson,
  cmdSelectAll,
  cmdToggleElbow,
  cmdZoomReset,
} from '../lib/commands';

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

/** Глобальные горячие клавиши. */
export function useKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUi.getState();
      const doc = useDoc.getState();

      if (e.key === 'Escape') {
        cmdEscape();
        return;
      }
      if (isEditable(e.target)) return;
      // Пока открыт диалог, полотно клавиши не слушает.
      if (ui.dialog) return;

      if (e.code === 'Space' && !e.repeat) {
        ui.setSpacePan(true);
        e.preventDefault();
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) doc.redo();
          else doc.undo();
          return;
        }
        if (key === 'y') {
          e.preventDefault();
          doc.redo();
          return;
        }
        if (key === 'c') {
          e.preventDefault();
          cmdCopy();
          return;
        }
        if (key === 'v') {
          e.preventDefault();
          cmdPaste();
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          cmdDuplicate();
          return;
        }
        if (key === 'a') {
          e.preventDefault();
          cmdSelectAll();
          return;
        }
        if (key === 's') {
          e.preventDefault();
          cmdSaveJson();
          return;
        }
        if (key === 'e') {
          e.preventDefault();
          ui.setDialog('export');
          return;
        }
        if (key === '0') {
          e.preventDefault();
          cmdZoomReset();
          return;
        }
        if (key === '1') {
          e.preventDefault();
          cmdFit();
          return;
        }
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          cmdDelete();
          break;
        case 'Enter':
          if (ui.wireDraft) {
            e.preventDefault();
            cmdFinishWire();
          }
          break;
        case 'Tab':
          if (ui.wireDraft) {
            e.preventDefault();
            cmdToggleElbow();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const step = e.shiftKey ? 1 : doc.doc.grid;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          cmdNudge(dx, dy);
          break;
        }
        case '?':
          ui.setDialog('shortcuts');
          break;
        default:
          break;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          ui.setTool('select');
          break;
        case 'h':
          ui.setTool('hand');
          break;
        case 'w':
          ui.setTool('wire');
          break;
        case 't':
          ui.setTool('text');
          break;
        case 'g':
          ui.setSettings({ snap: !ui.settings.snap });
          break;
        case 'r':
          cmdRotate(e.shiftKey ? 45 : 90);
          break;
        case 'f':
          cmdMirror();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') useUi.getState().setSpacePan(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const onBlur = () => useUi.getState().setSpacePan(false);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
