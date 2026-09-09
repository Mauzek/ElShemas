import { useEffect, useRef } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { getCurrentId, loadSchema, saveSchema, setCurrentId } from '../lib/storage';
import { clearShareHash, readSharedDoc } from '../lib/share';
import { makeId } from '../lib/ids';
import { cmdFit } from '../lib/commands';

/** Восстановление последней схемы при загрузке и автосохранение с дебаунсом. */
export function usePersistence(): void {
  const doc = useDoc((s) => s.doc);
  const docId = useDoc((s) => s.docId);
  const historyLength = useDoc((s) => s.past.length);
  const sharedNotice = useUi((s) => s.sharedNotice);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    // Схема из ссылки важнее последней открытой: пользователь пришёл именно за ней.
    const shared = readSharedDoc(window.location.hash);
    if (shared) {
      useDoc.getState().setDoc(shared.doc, makeId('doc'));
      useUi.getState().setSharedNotice(true);
      clearShareHash();
      // Пришедший по ссылке видит схему целиком, а не кусок в углу.
      window.setTimeout(cmdFit, 80);
      return;
    }
    const id = getCurrentId();
    if (!id) return;
    const stored = loadSchema(id);
    if (stored) useDoc.getState().setDoc(stored, id);
  }, []);

  useEffect(() => {
    // Пока схему из ссылки не приняли, она не попадает в «Мои схемы».
    if (sharedNotice) return;
    const isEmpty = doc.elements.length === 0 && doc.wires.length === 0 && doc.labels.length === 0;
    if (isEmpty && historyLength === 0) return;
    const timer = window.setTimeout(() => {
      saveSchema(docId, doc);
      setCurrentId(docId);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [doc, docId, historyLength, sharedNotice]);
}

/** Тема оформления применяется к корневому элементу. */
export function useTheme(): void {
  const theme = useUi((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
