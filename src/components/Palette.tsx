import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { CATEGORY_ORDER, SYMBOLS } from '../symbols/registry';
import { CATEGORY_COLORS, CATEGORY_TITLES, type SymbolCategory, type SymbolDef } from '../symbols/types';
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
      className="no-print card flex h-full flex-col overflow-hidden"
      style={{ width: collapsed ? 76 : 232, flex: '0 0 auto' }}
      aria-label="Библиотека элементов"
    >
      <div className="flex items-center gap-1 px-2 pt-2">
        {!collapsed && (
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ui-muted)' }}
            />
            <input
              className="field"
              style={{ paddingLeft: 28 }}
              placeholder="Поиск элемента"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск по элементам"
            />
          </div>
        )}
        <button
          className="tbtn"
          onClick={onToggleCollapsed}
          data-tip={collapsed ? 'Развернуть палитру' : 'Свернуть палитру'}
          aria-label={collapsed ? 'Развернуть палитру' : 'Свернуть палитру'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-2 py-2">
        {groups.map(({ category, items }) => {
          const isClosed = closed.has(category) && !collapsed;
          return (
            <section key={category} className="mb-1.5" style={{ ['--cat' as string]: CATEGORY_COLORS[category] }}>
              {!collapsed && (
                <button
                  className="tbtn w-full justify-start px-2"
                  style={{ height: 26 }}
                  onClick={() => toggle(category)}
                  aria-expanded={!isClosed}
                >
                  {isClosed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <span className="cat-dot" aria-hidden="true" />
                  <span className="section-title" style={{ color: 'var(--cat)' }}>
                    {CATEGORY_TITLES[category]}
                  </span>
                </button>
              )}
              {collapsed && <span className="cat-rule" aria-hidden="true" data-tip={CATEGORY_TITLES[category]} />}
              {!isClosed && (
                <div className={collapsed ? 'flex flex-col items-center gap-1' : 'grid grid-cols-2 gap-1'}>
                  {items.map((def) => (
                    <button
                      key={def.type}
                      className={`palette-item ${placingType === def.type ? 'active' : ''}`}
                      style={{ width: collapsed ? 56 : 'auto' }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-elshemas-symbol', def.type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => startPlacing(def.type)}
                      data-tip={def.title}
                    >
                      <SymbolPreview def={def} width={collapsed ? 46 : 62} height={collapsed ? 28 : 32} />
                      {!collapsed && <span className="palette-caption">{def.title}</span>}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {groups.length === 0 && (
          <p className="px-3 py-6 text-center" style={{ color: 'var(--ui-muted)' }}>
            Ничего не найдено
          </p>
        )}
      </div>
    </aside>
  );
}
