import { Link2, X } from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { saveSchema, setCurrentId } from '../lib/storage';

/**
 * Схема, открытая по ссылке, не попадает в «Мои схемы» сама:
 * иначе библиотека забьётся всем, что когда-либо открывали.
 */
export function ShareBanner() {
  const shown = useUi((s) => s.sharedNotice);
  const setSharedNotice = useUi((s) => s.setSharedNotice);
  const showToast = useUi((s) => s.showToast);
  const doc = useDoc((s) => s.doc);
  const docId = useDoc((s) => s.docId);

  if (!shown) return null;

  const save = () => {
    saveSchema(docId, doc);
    setCurrentId(docId);
    setSharedNotice(false);
    showToast(`Схема «${doc.title}» сохранена в «Мои схемы»`);
  };

  return (
    <div className="share-banner no-print" role="status">
      <Link2 size={16} style={{ color: 'var(--ui-accent)', flex: '0 0 auto' }} />
      <span>
        Схема открыта по ссылке и пока нигде не сохранена.
      </span>
      <button className="tbtn tbtn-primary" onClick={save}>
        Сохранить в мои схемы
      </button>
      <button
        className="tbtn"
        onClick={() => setSharedNotice(false)}
        data-tip="Скрыть: дальше схема сохраняется автоматически"
        aria-label="Скрыть сообщение"
      >
        <X size={15} />
      </button>
    </div>
  );
}
