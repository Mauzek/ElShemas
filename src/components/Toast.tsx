import { useUi } from '../store/useUi';

/** Короткое сообщение внизу экрана: импорт, экспорт, ошибки файла. */
export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      className="toast no-print fixed bottom-14 left-1/2 z-50 -translate-x-1/2 px-4 py-2"
      role="status"
      style={{ maxWidth: 460, fontWeight: 600 }}
    >
      {toast}
    </div>
  );
}
