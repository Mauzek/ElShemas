import { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useUi } from '../../store/useUi';
import { Dialog } from './Dialog';

/** Подтверждение действия: удаление схемы, сброс полотна и т. п. */
export function ConfirmDialog() {
  const request = useUi((s) => s.confirm);
  const closeConfirm = useUi((s) => s.closeConfirm);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (request) confirmRef.current?.focus();
  }, [request]);

  if (!request) return null;
  const { title, message, confirmLabel, cancelLabel = 'Отмена', danger, onConfirm } = request;

  const accept = () => {
    closeConfirm();
    onConfirm();
  };

  return (
    <Dialog
      title={title}
      icon={danger ? AlertTriangle : HelpCircle}
      tone={danger ? 'danger' : 'accent'}
      onClose={closeConfirm}
      width={430}
      footer={
        <>
          <button className="tbtn" onClick={closeConfirm}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={danger ? 'tbtn tbtn-solid-danger' : 'tbtn tbtn-primary'}
            onClick={accept}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ lineHeight: '19px', color: 'var(--ui-muted)' }}>{message}</p>
    </Dialog>
  );
}
