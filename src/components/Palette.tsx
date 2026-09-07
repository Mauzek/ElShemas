import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { CATEGORY_ORDER, SYMBOLS } from '../symbols/registry';
import { CATEGORY_TITLES, type SymbolCategory, type SymbolDef } from '../symbols/types';
import { useUi } from '../store/useUi';
import { SymbolPreview } from './SymbolPreview';

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Palette({ collapsed, onToggleCollapsed }: Props) {
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Set<SymbolCategory>>(new Set());
  const startPlacing = useUi((s) => s.startPlacing);
  const placingType = useUi((s) => s.placingType);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (def: SymbolDef) =>
      !q || `${def.title} ${def.keywords} ${def.prefix}`.toLowerCase().includes(q);
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: SYMBOLS.filter((s) => s.category === category && match(s)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const toggle = (category: SymbolCategory) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  return (
    <aside
      className="no-print panel divider-r flex h-full flex-col"
      style={{ width: collapsed ? 64 : 220 }}
      aria-label="Библиотека элементов"
    >
      <div className="divider-b flex items-center gap-1 px-2" style={{ height: 36 }}>
        {!collapsed && (
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-muted)' }} />
            <input
              className="field"
              style={{ paddingLeft: 22 }}
              placeholder="Поиск"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск по элементам"
            />
          </div>
        )}
        <button
          className="tbtn"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Развернуть палитру' : 'Свернуть палитру'}
          aria-label={collapsed ? 'Развернуть палитру' : 'Свернуть палитру'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto py-1">
        {groups.map(({ category, items }) => {
          const isClosed = closed.has(category) && !collapsed;
          return (
            <section key={category} className="mb-1">
              {!collapsed && (
                <button
                  className="flex w-full items-center gap-1 px-2 py-1"
                  onClick={() => toggle(category)}
                  aria-expanded={!isClosed}
                >
                  {isClosed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span className="section-title">{CATEGORY_TITLES[category]}</span>
                </button>
              )}
              {!isClosed && (
                <div className={collapsed ? 'flex flex-col items-center gap-1' : 'grid grid-cols-2 gap-1 px-2'}>
                  {items.map((def) => (
                    <button
                      key={def.type}
                      className={`tbtn flex-col ${placingType === def.type ? 'active' : ''}`}
                      style={{ height: collapsed ? 40 : 62, width: collapsed ? 46 : 'auto', padding: 2 }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-elshemas-symbol', def.type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => startPlacing(def.type)}
                      title={def.title}
                    >
                      <SymbolPreview def={def} width={collapsed ? 40 : 56} height={collapsed ? 26 : 30} />
                      {!collapsed && (
                        <span className="w-full truncate text-center" style={{ fontSize: 10.5, lineHeight: '12px' }}>
                          {def.title}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {groups.length === 0 && (
          <p className="px-3 py-4 text-center" style={{ color: 'var(--ui-muted)' }}>
            Ничего не найдено
          </p>
        )}
      </div>
    </aside>
  );
}
