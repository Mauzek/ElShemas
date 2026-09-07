import { useEffect, useRef } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { getCurrentId, loadSchema, saveSchema, setCurrentId } from '../lib/storage';

/** Восстановление последней схемы при загрузке и автосохранение с дебаунсом. */
export function usePersistence(): void {
  const doc = useDoc((s) => s.doc);
  const docId = useDoc((s) => s.docId);
  const historyLength = useDoc((s) => s.past.length);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const id = getCurrentId();
    if (!id) return;
    const stored = loadSchema(id);
    if (stored) useDoc.getState().setDoc(stored, id);
  }, []);

  useEffect(() => {
    const isEmpty = doc.elements.length === 0 && doc.wires.length === 0 && doc.labels.length === 0;
    if (isEmpty && historyLength === 0) return;
    const timer = window.setTimeout(() => {
      saveSchema(docId, doc);
      setCurrentId(docId);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [doc, docId, historyLength]);
}

/** Тема оформления применяется к корневому элементу. */
export function useTheme(): void {
  const theme = useUi((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
