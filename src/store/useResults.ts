import { create } from 'zustand';
import type { DcResult } from '../lib/solver/types';

interface ResultsState {
  /** Последний расчёт, включая неудачный: из него берётся список замечаний. */
  result: DcResult | null;
  /** Последний успешный расчёт: его числа показываются на схеме. */
  shown: DcResult | null;
  /** Схема изменилась, пересчёт ещё не закончен. */
  stale: boolean;
  /** Ветвь под курсором — для карточки с подробностями. */
  hovered: string | null;

  setResult: (result: DcResult) => void;
  setStale: (stale: boolean) => void;
  setHovered: (elementId: string | null) => void;
  clear: () => void;
}

export const useResults = create<ResultsState>((set) => ({
  result: null,
  shown: null,
  stale: false,
  hovered: null,

  setResult: (result) =>
    set((s) => ({ result, shown: result.ok ? result : s.shown, stale: false })),
  setStale: (stale) => set({ stale }),
  setHovered: (hovered) => set({ hovered }),
  clear: () => set({ result: null, shown: null, stale: false, hovered: null }),
}));

/** Результат по элементу: подписи на схеме и карточка при наведении. */
export function branchOf(result: DcResult | null, elementId: string) {
  return result?.branches.find((b) => b.elementId === elementId) ?? null;
}
