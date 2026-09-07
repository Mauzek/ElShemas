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

/**
 * Глобальные горячие клавиши.
 * Раскладка не важна: разбираем `event.code` — физическую клавишу,
 * поэтому Ctrl+Я работает так же, как Ctrl+Z.
 */
export function useKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUi.getState();
      const doc = useDoc.getState();

      if (e.code === 'Escape') {
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

      if (e.ctrlKey || e.metaKey) {
        switch (e.code) {
          case 'KeyZ':
            e.preventDefault();
            if (e.shiftKey) doc.redo();
            else doc.undo();
            return;
          case 'KeyY':
            e.preventDefault();
            doc.redo();
            return;
          case 'KeyC':
            e.preventDefault();
            cmdCopy();
            return;
          case 'KeyV':
            e.preventDefault();
            cmdPaste();
            return;
          case 'KeyD':
            e.preventDefault();
            cmdDuplicate();
            return;
          case 'KeyA':
            e.preventDefault();
            cmdSelectAll();
            return;
          case 'KeyS':
            e.preventDefault();
            cmdSaveJson();
            return;
          case 'KeyE':
            e.preventDefault();
            ui.setDialog('export');
            return;
          case 'Digit0':
          case 'Numpad0':
            e.preventDefault();
            cmdZoomReset();
            return;
          case 'Digit1':
          case 'Numpad1':
            e.preventDefault();
            cmdFit();
            return;
          default:
            return;
        }
      }

      switch (e.code) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          cmdDelete();
          return;
        case 'Enter':
        case 'NumpadEnter':
          if (ui.wireDraft) {
            e.preventDefault();
            cmdFinishWire();
          }
          return;
        case 'Tab':
          if (ui.wireDraft) {
            e.preventDefault();
            cmdToggleElbow();
          }
          return;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const step = e.shiftKey ? 1 : doc.doc.grid;
          const dx = e.code === 'ArrowLeft' ? -step : e.code === 'ArrowRight' ? step : 0;
          const dy = e.code === 'ArrowUp' ? -step : e.code === 'ArrowDown' ? step : 0;
          cmdNudge(dx, dy);
          return;
        }
        case 'KeyV':
          ui.setTool('select');
          return;
        case 'KeyH':
          ui.setTool('hand');
          return;
        case 'KeyW':
          ui.setTool('wire');
          return;
        case 'KeyT':
          ui.setTool('text');
          return;
        case 'KeyP':
          ui.setTool('draw');
          return;
        case 'KeyG':
          if (e.shiftKey) ui.setSettings({ showGrid: !ui.settings.showGrid });
          else ui.setSettings({ snap: !ui.settings.snap });
          return;
        case 'KeyR':
          cmdRotate(e.shiftKey ? 45 : 90);
          return;
        case 'KeyF':
          cmdMirror();
          return;
        default:
          break;
      }

      // «?» — на латинской раскладке Shift+/, на русской Shift+7.
      if (e.key === '?' || (e.shiftKey && (e.code === 'Slash' || e.code === 'Digit7'))) {
        ui.setDialog('shortcuts');
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
