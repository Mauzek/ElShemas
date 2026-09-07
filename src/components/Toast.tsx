import { useUi } from '../store/useUi';

/** Короткое сообщение внизу экрана: импорт, экспорт, ошибки файла. */
export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      className="no-print fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded border px-3 py-2"
      role="status"
      style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)', maxWidth: 460 }}
    >
      {toast}
    </div>
  );
}
