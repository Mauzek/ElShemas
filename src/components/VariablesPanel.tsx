import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { formatNumber } from '../lib/units';
import { isValidVariableName, resolveVariables } from '../lib/variables';
import { TextField } from './TextField';

/**
 * Переменные схемы: имя → выражение. Значение элемента может ссылаться на них
 * («2*R»), поэтому один вариант задания правится в одном месте.
 */
export function VariablesPanel() {
  const variables = useDoc((s) => s.doc.variables);
  const setVariables = useDoc((s) => s.setVariables);
  const [newName, setNewName] = useState('');
  const names = Object.keys(variables);
  const resolved = resolveVariables(variables);

  const rename = (from: string, to: string) => {
    const name = to.trim();
    if (!name || name === from || !isValidVariableName(name) || name in variables) return;
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) next[key === from ? name : key] = value;
    setVariables(next);
  };

  const add = () => {
    const name = newName.trim();
    if (!isValidVariableName(name) || name in variables) return;
    setVariables({ ...variables, [name]: '100' });
    setNewName('');
  };

  const remove = (name: string) => {
    const next = { ...variables };
    delete next[name];
    setVariables(next);
  };

  return (
    <>
      {names.length === 0 && (
        <p className="mb-2" style={{ color: 'var(--ui-muted)', lineHeight: '17px' }}>
          Задайте переменную и пишите в значении элемента «2*R» — при смене варианта
          пересчитается вся схема.
        </p>
      )}

      {names.map((name) => {
        const error = resolved.errors[name];
        const value = resolved.values[name];
        return (
          <div key={name} className="mb-1.5 grid items-center gap-1" style={{ gridTemplateColumns: '64px 1fr 26px' }}>
            <TextField value={name} onCommit={(v) => rename(name, v)} ariaLabel={`Имя переменной ${name}`} />
            <TextField
              value={variables[name]}
              onCommit={(v) => setVariables({ ...variables, [name]: v })}
              ariaLabel={`Значение переменной ${name}`}
            />
            <button className="tbtn" onClick={() => remove(name)} data-tip="Удалить переменную" aria-label={`Удалить ${name}`}>
              <Trash2 size={14} />
            </button>
            <span
              style={{ gridColumn: '2 / 4', color: error ? 'var(--ui-danger)' : 'var(--ui-muted)', fontSize: 11 }}
            >
              {error ?? `= ${formatNumber(value, 6)}`}
            </span>
          </div>
        );
      })}

      <div className="mt-1 grid items-center gap-1" style={{ gridTemplateColumns: '1fr 26px' }}>
        <input
          className="field"
          value={newName}
          placeholder="Новая переменная"
          aria-label="Имя новой переменной"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
            e.stopPropagation();
          }}
        />
        <button
          className="tbtn"
          onClick={add}
          disabled={!isValidVariableName(newName) || newName.trim() in variables}
          data-tip="Добавить переменную"
          aria-label="Добавить переменную"
        >
          <Plus size={14} />
        </button>
      </div>
    </>
  );
}
