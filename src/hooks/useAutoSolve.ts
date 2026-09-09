import { useEffect } from 'react';
import { useDoc } from '../store/useDoc';
import { useResults } from '../store/useResults';
import { solveDc } from '../lib/solver/dc';

/**
 * Автоматический пересчёт схемы с дебаунсом.
 * Пока считается новая версия, на схеме остаются прежние числа — они лишь затеняются,
 * поэтому подписи не мигают при каждом движении мыши.
 */
const DEBOUNCE_MS = 150;

export function useAutoSolve(): void {
  const doc = useDoc((s) => s.doc);
  const enabled = useDoc((s) => s.doc.analysis.enabled);

  useEffect(() => {
    if (!enabled) {
      useResults.getState().clear();
      return;
    }
    useResults.getState().setStale(true);
    const timer = window.setTimeout(() => {
      useResults.getState().setResult(solveDc(useDoc.getState().doc));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [doc, enabled]);
}
